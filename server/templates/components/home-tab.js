
// HomeTab component for external widget
window.HomeTab = function({ onStartChat, isMobile }) {
    const { useState } = React;
    const [selectedCategory, setSelectedCategory] = useState('all');

    const chatTopics = [
        {
            id: 'product_info',
            title: 'Product Information',
            description: 'Learn about our products and features',
            icon: '💬',
            message: 'Hi! I would like to learn more about your products and features.',
            category: 'sales',
            popular: true
        },
        {
            id: 'order_status',
            title: 'Order Status',
            description: 'Check your order status and tracking',
            icon: '🚚',
            message: 'I need help checking my order status and tracking information.',
            category: 'support'
        },
        {
            id: 'billing_help',
            title: 'Billing Support',
            description: 'Questions about billing and payments',
            icon: '💳',
            message: 'I have a question about billing and payments.',
            category: 'billing'
        },
        {
            id: 'returns',
            title: 'Returns & Exchanges',
            description: 'Return or exchange your purchase',
            icon: '🔄',
            message: 'I need help with returning or exchanging my purchase.',
            category: 'support',
            popular: true
        },
        {
            id: 'shopping_help',
            title: 'Shopping Assistance',
            description: 'Get help finding the right product',
            icon: '🛒',
            message: 'I need assistance finding the right product for my needs.',
            category: 'sales'
        },
        {
            id: 'technical_support',
            title: 'Technical Support',
            description: 'Troubleshoot technical issues',
            icon: '🛡️',
            message: 'I am experiencing technical issues and need support.',
            category: 'support'
        },
        {
            id: 'promotions',
            title: 'Deals & Promotions',
            description: 'Current offers and discounts',
            icon: '🎁',
            message: 'What deals and promotions do you currently have available?',
            category: 'sales',
            popular: true
        },
        {
            id: 'contact_agent',
            title: 'Talk to Human Agent',
            description: 'Connect with a human representative',
            icon: '📞',
            message: 'I would like to speak with a human agent please.',
            category: 'support'
        }
    ];

    const filteredTopics = selectedCategory === 'all' 
        ? chatTopics 
        : chatTopics.filter(topic => topic.category === selectedCategory);

    const popularTopics = chatTopics.filter(topic => topic.popular);

    const handleTopicClick = (topic) => {
        onStartChat(topic.title, topic.message);
    };

    const getCategoryColor = (category) => {
        const colors = {
            support: 'bg-blue-50 text-blue-700 border-blue-200',
            sales: 'bg-green-50 text-green-700 border-green-200', 
            billing: 'bg-purple-50 text-purple-700 border-purple-200'
        };
        return colors[category] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    return React.createElement('div', {
        className: 'h-full overflow-y-auto'
    }, [
        // Welcome Header
        React.createElement('div', {
            key: 'header',
            className: 'bg-white border-b border-neutral-200 p-6'
        }, [
            React.createElement('div', {
                key: 'header-content',
                className: 'text-center'
            }, [
                React.createElement('h2', {
                    key: 'title',
                    className: 'text-2xl font-bold text-gray-900 mb-2'
                }, 'Welcome! How can we help you today?'),
                React.createElement('p', {
                    key: 'subtitle',
                    className: 'text-gray-600'
                }, 'Choose a topic below or start a free conversation')
            ])
        ]),
        
        // Content
        React.createElement('div', {
            key: 'content',
            className: 'p-4 space-y-6 pb-8'
        }, [
            // Quick Actions
            React.createElement('div', {
                key: 'quick-actions',
                className: 'space-y-3'
            }, [
                React.createElement('h3', {
                    key: 'quick-title',
                    className: 'font-semibold text-gray-900 text-sm uppercase tracking-wide'
                }, 'Quick Actions'),
                React.createElement('div', {
                    key: 'quick-buttons',
                    className: 'grid grid-cols-1 gap-3'
                }, [
                    React.createElement('button', {
                        key: 'free-chat',
                        onClick: () => onStartChat('Free Chat'),
                        className: 'h-auto p-4 justify-start bg-blue-600 hover:bg-blue-700 text-white rounded-lg border-0 cursor-pointer transition-colors flex items-center'
                    }, [
                        React.createElement('span', {
                            key: 'icon',
                            className: 'mr-3 text-lg'
                        }, '💬'),
                        React.createElement('div', {
                            key: 'content',
                            className: 'text-left'
                        }, [
                            React.createElement('div', {
                                key: 'title',
                                className: 'font-medium'
                            }, 'Start Free Chat'),
                            React.createElement('div', {
                                key: 'desc',
                                className: 'text-xs opacity-90'
                            }, 'Ask anything you want')
                        ])
                    ]),
                    React.createElement('button', {
                        key: 'agent',
                        onClick: () => onStartChat('Live Agent', 'I would like to speak with a human agent please.'),
                        className: 'h-auto p-4 justify-start bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 rounded-lg cursor-pointer transition-colors flex items-center'
                    }, [
                        React.createElement('span', {
                            key: 'icon',
                            className: 'mr-3 text-lg'
                        }, '📞'),
                        React.createElement('div', {
                            key: 'content',
                            className: 'text-left'
                        }, [
                            React.createElement('div', {
                                key: 'title',
                                className: 'font-medium'
                            }, 'Request Live Agent'),
                            React.createElement('div', {
                                key: 'desc',
                                className: 'text-xs text-gray-600'
                            }, 'Talk to a human representative')
                        ])
                    ])
                ])
            ]),

            // Popular Topics
            React.createElement('div', {
                key: 'popular',
                className: 'space-y-3'
            }, [
                React.createElement('div', {
                    key: 'popular-header',
                    className: 'flex items-center gap-2'
                }, [
                    React.createElement('h3', {
                        key: 'popular-title',
                        className: 'font-semibold text-gray-900 text-sm uppercase tracking-wide'
                    }, 'Popular Topics'),
                    React.createElement('span', {
                        key: 'star',
                        className: 'text-yellow-500'
                    }, '⭐')
                ]),
                React.createElement('div', {
                    key: 'popular-grid',
                    className: 'grid grid-cols-1 gap-3'
                }, popularTopics.map((topic) => 
                    React.createElement('div', {
                        key: topic.id,
                        className: 'cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-600 rounded-lg border bg-white shadow-sm p-4',
                        onClick: () => handleTopicClick(topic)
                    }, [
                        React.createElement('div', {
                            key: 'topic-content',
                            className: 'flex items-start gap-3'
                        }, [
                            React.createElement('div', {
                                key: 'icon',
                                className: 'text-blue-600 mt-1 text-lg'
                            }, topic.icon),
                            React.createElement('div', {
                                key: 'details',
                                className: 'flex-1'
                            }, [
                                React.createElement('div', {
                                    key: 'header',
                                    className: 'flex items-center gap-2 mb-1'
                                }, [
                                    React.createElement('h4', {
                                        key: 'title',
                                        className: 'font-medium text-gray-900'
                                    }, topic.title),
                                    React.createElement('span', {
                                        key: 'category',
                                        className: `text-xs px-2 py-1 rounded-full border ${getCategoryColor(topic.category)}`
                                    }, topic.category)
                                ]),
                                React.createElement('p', {
                                    key: 'description',
                                    className: 'text-sm text-gray-600'
                                }, topic.description)
                            ])
                        ])
                    ])
                ))
            ]),

            // Category Filter
            React.createElement('div', {
                key: 'categories',
                className: 'space-y-3'
            }, [
                React.createElement('h3', {
                    key: 'cat-title',
                    className: 'font-semibold text-gray-900 text-sm uppercase tracking-wide'
                }, 'Browse by Category'),
                React.createElement('div', {
                    key: 'cat-filters',
                    className: 'flex flex-wrap gap-2'
                }, ['all', 'support', 'sales', 'billing'].map((category) =>
                    React.createElement('button', {
                        key: category,
                        onClick: () => setSelectedCategory(category),
                        className: `px-3 py-1 text-sm rounded-md border cursor-pointer transition-colors capitalize ${
                            selectedCategory === category 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`
                    }, category === 'all' ? 'All Topics' : category)
                ))
            ]),

            // All Topics
            React.createElement('div', {
                key: 'all-topics',
                className: 'space-y-3'
            }, [
                React.createElement('h3', {
                    key: 'all-title',
                    className: 'font-semibold text-gray-900 text-sm uppercase tracking-wide'
                }, selectedCategory === 'all' ? 'All Topics' : `${selectedCategory} Topics`),
                React.createElement('div', {
                    key: 'all-grid',
                    className: 'grid grid-cols-1 gap-3'
                }, filteredTopics.map((topic) => 
                    React.createElement('div', {
                        key: topic.id,
                        className: 'cursor-pointer hover:shadow-md transition-shadow rounded-lg border bg-white shadow-sm p-4',
                        onClick: () => handleTopicClick(topic)
                    }, [
                        React.createElement('div', {
                            key: 'topic-content',
                            className: 'flex items-start gap-3'
                        }, [
                            React.createElement('div', {
                                key: 'icon',
                                className: 'text-gray-600 mt-1 text-lg'
                            }, topic.icon),
                            React.createElement('div', {
                                key: 'details',
                                className: 'flex-1'
                            }, [
                                React.createElement('div', {
                                    key: 'header',
                                    className: 'flex items-center gap-2 mb-1'
                                }, [
                                    React.createElement('h4', {
                                        key: 'title',
                                        className: 'font-medium text-gray-900'
                                    }, topic.title),
                                    React.createElement('span', {
                                        key: 'category',
                                        className: `text-xs px-2 py-1 rounded-full border ${getCategoryColor(topic.category)}`
                                    }, topic.category),
                                    ...(topic.popular ? [React.createElement('span', {
                                        key: 'popular',
                                        className: 'text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700'
                                    }, 'Popular')] : [])
                                ]),
                                React.createElement('p', {
                                    key: 'description',
                                    className: 'text-sm text-gray-600'
                                }, topic.description)
                            ])
                        ])
                    ])
                ))
            ])
        ])
    ]);
};
