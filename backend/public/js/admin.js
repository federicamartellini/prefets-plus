function showAdminPanel() {
    const modal = new bootstrap.Modal(document.getElementById('adminPanel'));
    modal.show();
}

async function deleteMessage(messageId) {
    if (confirm('Voulez-vous vraiment supprimer ce message ?')) {
        try {
            const response = await fetch(`/admin/message/${messageId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                location.reload();
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }
}

async function removeFromFriendsList(userId) {
    if (confirm('Voulez-vous vraiment retirer cet ami ?')) {
        try {
            const response = await fetch(`/admin/friend/${userId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                location.reload();
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }
}