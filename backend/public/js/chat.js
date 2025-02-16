const unreadMessages = new Map(); // Pour stocker le nombre de messages non lus par contact

function updateUnreadCounter(contactId) {
    const count = unreadMessages.get(contactId) || 0;
    const counterElement = document.querySelector(`#newMessage-${contactId} .message-count`);
    const buttonElement = document.getElementById(`newMessage-${contactId}`);
    
    if (count > 0) {
        buttonElement.classList.remove('d-none');
        counterElement.textContent = count;
    } else {
        buttonElement.classList.add('d-none');
    }
}

function incrementUnreadMessages(contactId) {
    const currentCount = unreadMessages.get(contactId) || 0;
    unreadMessages.set(contactId, currentCount + 1);
    updateUnreadCounter(contactId);
}

function resetUnreadMessages(contactId) {
    unreadMessages.set(contactId, 0);
    updateUnreadCounter(contactId);
}