
function HomeTab({ onStartChat, isMobile }) {
    const topics = [
        {
            id: 'billing',
            title: 'Billing & Payments',
            description: 'Questions about invoices, payments, and billing',
            icon: '💳',
            message: 'I have a question about billing and payments'
        },
        {
            id: 'technical',
            title: 'Technical Support',
            description: 'Help with technical issues and troubleshooting',
            icon: '🔧',
            message: 'I need technical support'
        },
        {
            id: 'sales',
            title: 'Sales Questions',
            description: 'Product information and sales inquiries',
            icon: '💼',
            message: 'I have sales questions'
        },
        {
            id: 'general',
            title: 'General Support',
            description: 'General questions and other topics',
            icon: '💬',
            message: 'I need general support'
        }
    ];

    return React.createElement('div', { className: 'home-content' }, [
        React.createElement('div', { key: 'welcome', className: 'welcome-section' }, [
            React.createElement('h2', { 
                key: 'title',
                style: { fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }
            }, 'Welcome to Support'),
            React.createElement('p', { 
                key: 'subtitle',
                style: { color: '#6b7280', marginBottom: '32px' }
            }, 'How can we help you today? Choose a topic below to get started.')
        ]),
        React.createElement('div', { key: 'topics', className: 'topic-grid' }, 
            topics.map(topic => 
                React.createElement('div', {
                    key: topic.id,
                    className: 'topic-card',
                    onClick: () => onStartChat(topic.id, topic.message)
                }, [
                    React.createElement('div', { key: 'icon', className: 'topic-icon' }, topic.icon),
                    React.createElement('h3', { 
                        key: 'title',
                        style: { fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }
                    }, topic.title),
                    React.createElement('p', { 
                        key: 'desc',
                        style: { fontSize: '14px', color: '#6b7280', margin: 0 }
                    }, topic.description)
                ])
            )
        )
    ]);
}
