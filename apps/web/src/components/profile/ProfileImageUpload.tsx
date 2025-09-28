import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { FaCamera, FaTimes } from 'react-icons/fa'

interface ProfileImageUploadProps {
    currentImage?: string
    onImageChange: (file: File | null) => void
    className?: string
}

export default function ProfileImageUpload({ currentImage, onImageChange, className = '' }: ProfileImageUploadProps) {
    const [preview, setPreview] = useState<string>('')
    const [imageFile, setImageFile] = useState<File | null>(null)

    const onDrop = (acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onload = (e) => {
                setPreview(e.target?.result as string)
                onImageChange(file)
            }
            reader.readAsDataURL(file)
        }
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
        },
        maxFiles: 1
    })

    const removeImage = () => {
        setImageFile(null)
        setPreview('')
        onImageChange(null)
    }

    const displayImage = preview || currentImage

    return (
        <div className={`relative ${className}`}>
            <div
                {...getRootProps()}
                className={`relative w-32 h-32 rounded-full border-2 border-dashed cursor-pointer transition-colors ${
                    isDragActive 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-300 hover:border-primary-400'
                }`}
            >
                <input {...getInputProps()} />
                
                {displayImage ? (
                    <div className="relative w-full h-full">
                        <img 
                            src={displayImage} 
                            alt="Profile" 
                            className="w-full h-full object-cover rounded-full"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 rounded-full flex items-center justify-center">
                            <FaCamera className="text-white opacity-0 hover:opacity-100 transition-opacity duration-200" size={24} />
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                            <FaCamera className="mx-auto text-gray-400 text-2xl mb-2" />
                            <p className="text-xs text-gray-500">
                                {isDragActive ? 'Drop image here' : 'Click to upload'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
            
            {displayImage && (
                <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                    <FaTimes size={12} />
                </button>
            )}
            
            <div className="text-xs text-gray-500 mt-2 text-center">
                <p>Max size: 5MB</p>
                <p>Formats: JPG, PNG, GIF, WebP</p>
            </div>
        </div>
    )
}
