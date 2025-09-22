import Swal from 'sweetalert2'

// Success alert
export const showSuccess = (title: string, text?: string) => {
    return Swal.fire({
        icon: 'success',
        title,
        text,
        confirmButtonColor: '#16a34a',
        confirmButtonText: 'OK'
    })
}

// Error alert
export const showError = (title: string, text?: string) => {
    return Swal.fire({
        icon: 'error',
        title,
        text,
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'OK'
    })
}

// Warning alert
export const showWarning = (title: string, text?: string) => {
    return Swal.fire({
        icon: 'warning',
        title,
        text,
        confirmButtonColor: '#d97706',
        confirmButtonText: 'OK'
    })
}

// Confirmation dialog
export const showConfirm = (
    title: string, 
    text: string, 
    confirmButtonText: string = 'Yes, do it!',
    cancelButtonText: string = 'Cancel'
) => {
    return Swal.fire({
        title,
        text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText,
        cancelButtonText,
        reverseButtons: true
    }).then(result => result.isConfirmed)
}

// Delete confirmation
export const showDeleteConfirm = (itemName: string) => {
    return Swal.fire({
        title: 'Are you sure?',
        text: `You are about to delete "${itemName}". This action cannot be undone!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        reverseButtons: true
    })
}

// Loading alert
export const showLoading = (title: string = 'Loading...') => {
    return Swal.fire({
        title,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading()
        }
    })
}

// Close loading
export const closeLoading = () => {
    Swal.close()
}