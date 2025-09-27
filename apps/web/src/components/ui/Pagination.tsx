import { FaChevronLeft, FaChevronRight, FaEllipsisH } from 'react-icons/fa'

interface PaginationProps {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    onPageChange: (page: number) => void
    showInfo?: boolean
    className?: string
}

export default function Pagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    showInfo = true,
    className = ''
}: PaginationProps) {
    // Don't render if there's only one page or no items
    if (totalPages <= 1) return null

    // Calculate page range to show
    const getPageNumbers = () => {
        const delta = 2 // Number of pages to show on each side of current page
        const range = []
        const rangeWithDots = []

        for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
            range.push(i)
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, '...')
        } else {
            rangeWithDots.push(1)
        }

        rangeWithDots.push(...range)

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push('...', totalPages)
        } else {
            rangeWithDots.push(totalPages)
        }

        return rangeWithDots
    }

    const pageNumbers = getPageNumbers()
    const startItem = (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalItems)

    return (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
            {/* Items info */}
            {showInfo && (
                <div className="text-sm text-gray-600">
                    Showing <span className="font-medium">{startItem}</span> to{' '}
                    <span className="font-medium">{endItem}</span> of{' '}
                    <span className="font-medium">{totalItems}</span> results
                </div>
            )}

            {/* Pagination controls */}
            <div className="flex items-center gap-1">
                {/* Previous button */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                    aria-label="Previous page"
                >
                    <FaChevronLeft className="w-3 h-3" />
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                    {pageNumbers.map((page, index) => (
                        <button
                            key={index}
                            onClick={() => typeof page === 'number' && onPageChange(page)}
                            disabled={page === '...'}
                            className={`flex items-center justify-center w-8 h-8 text-sm rounded-lg transition-colors ${
                                page === currentPage
                                    ? 'bg-primary-600 text-white'
                                    : page === '...'
                                    ? 'text-gray-400 cursor-default'
                                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                            aria-label={page === '...' ? 'More pages' : `Go to page ${page}`}
                        >
                            {page === '...' ? <FaEllipsisH className="w-3 h-3" /> : page}
                        </button>
                    ))}
                </div>

                {/* Next button */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                    aria-label="Next page"
                >
                    <FaChevronRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    )
}