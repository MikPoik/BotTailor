
function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
}

function groupMessages(messages) {
    const groups = [];
    let currentGroup = null;

    // Safety check to ensure messages is an array
    if (!Array.isArray(messages)) {
        console.warn('groupMessages: messages is not an array:', messages);
        return [];
    }

    messages.forEach(message => {
        const isFollowUp = message.metadata?.isFollowUp;
        
        if (!currentGroup || message.sender !== currentGroup.sender || !isFollowUp) {
            currentGroup = {
                sender: message.sender,
                messages: [message],
                timestamp: message.createdAt
            };
            groups.push(currentGroup);
        } else {
            currentGroup.messages.push(message);
        }
    });

    return groups;
}

function getOptionDisplayText(optionId) {
    const optionTexts = {
        billing: "I have a question about my billing",
        technical: "I need technical support", 
        sales: "I have a sales inquiry",
        payment: "I have payment issues",
        subscription: "I want to change my subscription",
        invoice: "I need to download an invoice",
        general: "I need general support"
    };
    return optionTexts[optionId] || optionId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
}
