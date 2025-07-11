function MessageBubble({ message, onOptionSelect, onQuickReply }) {
    const renderRichMessage = (message) => {
        if (message.messageType === 'card' && message.metadata) {
            return React.createElement('div', { 
                className: 'bubble card'
            }, [
                message.metadata.imageUrl && React.createElement('img', {
                    key: 'image',
                    src: message.metadata.imageUrl,
                    alt: message.metadata.title || 'Card image',
                    className: 'card-image'
                }),
                React.createElement('div', { key: 'content', className: 'card-content' }, [
                    message.metadata.title && React.createElement('h4', {
                        key: 'title',
                        className: 'card-title'
                    }, message.metadata.title),
                    message.metadata.description && React.createElement('p', {
                        key: 'desc',
                        className: 'card-description'
                    }, message.metadata.description),
                    message.content && message.content !== message.metadata.title && React.createElement('p', {
                        key: 'content'
                    }, message.content),
                    message.metadata.buttons && React.createElement('div', {
                        key: 'buttons',
                        style: { display: 'flex', flexDirection: 'column', gap: '8px' }
                    }, message.metadata.buttons.map((button, idx) => 
                        React.createElement('button', {
                            key: idx,
                            onClick: () => onOptionSelect(button.id, button.payload, button.text),
                            className: 'menu-option'
                        }, button.text)
                    ))
                ])
            ]);
        }

        if (message.messageType === 'menu' && message.metadata?.options) {
            return React.createElement('div', {
                className: 'bubble menu'
            }, [
                React.createElement('div', { key: 'content', className: 'menu-content' }, [
                    message.content && React.createElement('p', { key: 'text', style: { marginBottom: '12px' } }, message.content),
                    React.createElement('div', { 
                        key: 'options'
                    }, message.metadata.options.map((option, idx) =>
                        React.createElement('button', {
                            key: idx,
                            onClick: () => onOptionSelect(option.id, option.payload, option.text),
                            className: 'menu-option'
                        }, option.text)
                    ))
                ])
            ]);
        }

        if (message.messageType === 'image' && message.metadata?.imageUrl) {
            return React.createElement('div', {
                className: 'bubble card'
            }, [
                React.createElement('img', {
                    key: 'image',
                    src: message.metadata.imageUrl,
                    alt: message.metadata.title || 'Message image',
                    className: 'card-image'
                }),
                message.content && React.createElement('div', {
                    key: 'content',
                    className: 'card-content'
                }, React.createElement('p', {}, message.content))
            ]);
        }

        // Default text message
        return React.createElement('div', {
            className: `bubble ${message.sender}`
        }, [
            React.createElement('p', { key: 'content' }, message.content),
            message.metadata?.quickReplies && React.createElement('div', {
                key: 'quickReplies',
                className: 'quick-replies'
            }, message.metadata.quickReplies.map((reply, idx) =>
                React.createElement('button', {
                    key: idx,
                    onClick: () => onQuickReply(reply),
                    className: 'quick-reply'
                }, reply)
            ))
        ]);
    };

    return renderRichMessage(message);
}

// Signal component readiness
if (window.chatWidgetReadiness) {
    window.chatWidgetReadiness.messageBubble = true;
}