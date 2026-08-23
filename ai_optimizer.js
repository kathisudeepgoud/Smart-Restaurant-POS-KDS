const { getCollection } = require('./database');

async function getAiSuggestions() {
  const ordersCollection = getCollection('orders');
  const menuCollection = getCollection('menu');

  // 1. Fetch pending orders sorted by timestamp ascending
  const pendingOrders = await ordersCollection.find({ status: 'Pending' }).sort({ timestamp: 1 }).toArray();

  if (pendingOrders.length === 0) {
    return {
      batch_suggestions: ["All orders are caught up! No batch cooking recommendations at this time."],
      priority_warnings: ["No pending orders. Enjoy the quiet moment!"],
      recommended_sequence: []
    };
  }

  // 2. Fetch all menu items to cache details
  const menuItems = await menuCollection.find({}).toArray();
  const menuCache = {};
  menuItems.forEach(item => {
    menuCache[item._id.toString()] = item;
  });

  const getMenuItem = (itemId) => {
    const itemStr = itemId.toString();
    return menuCache[itemStr] || { name: `Unknown Item (${itemStr})`, prep_time_minutes: 10, price: 0.0 };
  };

  // 3. Batch cooking analysis and prioritization
  const itemGroupings = {}; // itemId -> Array of { orderId, label }
  const orderPriorities = [];
  const now = new Date();

  for (const order of pendingOrders) {
    const orderIdStr = order._id.toString();
    const orderType = order.order_type || 'Dine-in';
    const tableNum = order.table_number || 'N/A';
    const label = orderType === 'Dine-in' ? `Table ${tableNum}` : `Parcel ${tableNum}`;

    const timestamp = new Date(order.timestamp);
    const waitTimeMinutes = Math.max(0.0, (now - timestamp) / 60000);

    const itemIds = order.items || [];
    const resolvedItems = itemIds.map(id => getMenuItem(id));
    const prepTimes = resolvedItems.map(item => item.prep_time_minutes);
    const maxPrepTime = prepTimes.length > 0 ? Math.max(...prepTimes) : 5;

    // Calculate priority score
    let priorityScore = waitTimeMinutes * 1.5;
    if (orderType === 'Dine-in') {
      priorityScore += 5.0;
    }
    if (waitTimeMinutes > 12.0) {
      priorityScore += 20.0;
    }
    priorityScore += (15 - maxPrepTime) * 0.2;

    orderPriorities.push({
      order_id: orderIdStr,
      label,
      order_type: orderType,
      wait_time_minutes: Math.round(waitTimeMinutes * 10) / 10,
      max_prep_time: maxPrepTime,
      priority_score: Math.round(priorityScore * 100) / 100,
      items: resolvedItems.map(item => item.name)
    });

    for (const itemId of itemIds) {
      const itemStr = itemId.toString();
      if (!itemGroupings[itemStr]) {
        itemGroupings[itemStr] = [];
      }
      itemGroupings[itemStr].push({ order_id: orderIdStr, label });
    }
  }

  // Generate Batch Suggestions
  const batchSuggestions = [];
  for (const [itemId, orderRefs] of Object.entries(itemGroupings)) {
    if (orderRefs.length > 1) {
      const itemDetails = getMenuItem(itemId);
      const itemName = itemDetails.name;

      const labels = orderRefs.map(ref => ref.label);
      const labelCounts = {};
      labels.forEach(lbl => {
        labelCounts[lbl] = (labelCounts[lbl] || 0) + 1;
      });

      const destinationStrs = [];
      for (const [lbl, count] of Object.entries(labelCounts)) {
        if (count > 1) {
          destinationStrs.push(`${lbl} (x${count})`);
        } else {
          destinationStrs.push(lbl);
        }
      }

      let destText = '';
      if (destinationStrs.length > 1) {
        destText = destinationStrs.slice(0, -1).join(', ') + `, and ${destinationStrs[destinationStrs.length - 1]}`;
      } else {
        destText = destinationStrs[0];
      }

      batchSuggestions.push(
        `Batch cook ${orderRefs.length}x ${itemName}s for ${destText} (Reduces prep bottleneck)`
      );
    }
  }

  if (batchSuggestions.length === 0) {
    batchSuggestions.push("No identical items found. Proceed with standard cooking pipeline.");
  }

  // Sort orders by priority score in descending order
  orderPriorities.sort((a, b) => b.priority_score - a.priority_score);

  // Generate Priority Warnings
  const priorityWarnings = [];
  const urgentOrders = orderPriorities.filter(o => o.wait_time_minutes > 12.0);
  for (const uOrd of urgentOrders) {
    const itemListStr = uOrd.items.join(', ');
    priorityWarnings.push(
      `URGENT: ${uOrd.label} (${uOrd.order_type}) has been waiting ${uOrd.wait_time_minutes} mins! ` +
      `Prioritize: ${itemListStr} (Est. prep: ${uOrd.max_prep_time}m)`
    );
  }

  // Add a general flow suggestion based on the highest priority
  if (orderPriorities.length > 0 && urgentOrders.length === 0) {
    const topOrder = orderPriorities[0];
    priorityWarnings.push(
      `Recommended focus: Prepare ${topOrder.label} next. ` +
      `Contains: ${topOrder.items.join(', ')} (Wait time: ${topOrder.wait_time_minutes} mins)`
    );
  }

  // Formulate Recommended Sequence
  const recommendedSequence = orderPriorities.map((oPri, index) => {
    let itemSummary = oPri.items.slice(0, 2).join(', ');
    if (oPri.items.length > 2) {
      itemSummary += ` + ${oPri.items.length - 2} more`;
    }
    return {
      rank: index + 1,
      label: oPri.label,
      order_type: oPri.order_type,
      wait_time: `${oPri.wait_time_minutes}m`,
      items_summary: itemSummary,
      score: oPri.priority_score
    };
  });

  return {
    batch_suggestions: batchSuggestions,
    priority_warnings: priorityWarnings,
    recommended_sequence: recommendedSequence
  };
}

module.exports = {
  getAiSuggestions
};
