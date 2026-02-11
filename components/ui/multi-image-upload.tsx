"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Upload, X, Loader2, ZoomIn, ZoomOut, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import Cropper from "react-easy-crop"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { createClient } from "@/utils/supabase/client"

interface Point {
    x: number
    y: number
}

interface Area {
    x: number
    y: number
    width: number
    height: number
}



export interface UploadedFile {
    url: string
    type: "image" | "video"
}

interface MultiImageUploadProps {
    label?: string
    description?: string
    value?: UploadedFile[]
    onChange?: (files: UploadedFile[]) => void
    onRemove?: (index: number) => void
    path?: string
    maxSizeMB?: number
    className?: string
    aspect?: { width: number; height: number }
    dimensions?: { width?: number; height?: number } | "square" | "original"
    businessId?: string
    disabled?: boolean
    required?: boolean
    accept?: string
    error?: string
    restriction?: {
        type: string
        value: string
        message?: string
    }
}

export function MultiImageUpload({
    label,
    description,
    value = [],
    onChange,
    onRemove,
    path = "banner",
    maxSizeMB = 5,
    className,
    aspect,
    dimensions = "original",
    businessId,
    disabled = false,
    required = false,
    accept = "image/*,video/*",
    error,
    restriction
}: MultiImageUploadProps) {
    const supabase = createClient()
    const [uploadingFiles, setUploadingFiles] = useState<{ id: string; progress: number; name: string }[]>([])

    // Cropping state
    const [croppingQueue, setCroppingQueue] = useState<File[]>([])
    const [currentCroppingFile, setCurrentCroppingFile] = useState<File | null>(null)
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
    const [isCropping, setIsCropping] = useState(false)
    const [objectUrl, setObjectUrl] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file)
            const img = new Image()
            img.onload = () => {
                const dims = { width: img.naturalWidth, height: img.naturalHeight }
                URL.revokeObjectURL(url)
                resolve(dims)
            }
            img.onerror = () => {
                URL.revokeObjectURL(url)
                reject(new Error("Unable to read image dimensions"))
            }
            img.src = url
        })
    }

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return
        const files = Array.from(event.target.files || [])
        if (files.length === 0) return

        // Check restriction if provided (from upload.tsx logic)
        if (restriction) {
            if (restriction.type === "sku" && (!restriction.value || restriction.value.trim() === "")) {
                toast.error(restriction.message || "Please enter " + restriction.type + " before uploading image")
                return
            }
        }

        const filesToUpload: File[] = []
        const filesToCrop: File[] = []
        const maxSizeBytes = maxSizeMB * 1024 * 1024

        for (const file of files) {
            // 1. Size Validation
            if (file.size > maxSizeBytes) {
                toast.error(`File ${file.name} is too large. Max size is ${maxSizeMB}MB`)
                continue
            }

            // 2. Type Validation
            const isVideo = file.type.startsWith("video/")
            const isImage = file.type.startsWith("image/")

            if (!isVideo && !isImage) {
                toast.error(`File ${file.name} is not a valid file type`)
                continue
            }

            if (isVideo) {
                // Skip dimensions/cropping for video
                filesToUpload.push(file)
                continue
            }

            try {
                const imageDimensions = await getImageDimensions(file)

                // 3. Dimensions/Aspect Check for auto-cropping (Images only)
                let needsCrop = false
                if (dimensions === "square" && imageDimensions.width !== imageDimensions.height) {
                    needsCrop = true
                } else if (typeof dimensions === "object" && dimensions.width && dimensions.height) {
                    if (imageDimensions.width !== dimensions.width || imageDimensions.height !== dimensions.height) {
                        needsCrop = true
                    }
                }

                if (aspect && aspect.width > 0 && aspect.height > 0) {
                    const targetRatio = aspect.width / aspect.height
                    const actualRatio = imageDimensions.width / imageDimensions.height
                    const tolerance = 0.01
                    if (Math.abs(actualRatio - targetRatio) > tolerance) {
                        needsCrop = true
                    }
                }

                if (needsCrop) {
                    filesToCrop.push(file) // Will be processed by cropper
                } else {
                    filesToUpload.push(file)
                }
            } catch (err) {
                console.error("Dim check failed", err)
                toast.error(`Could not process ${file.name}`)
            }
        }

        if (filesToCrop.length > 0) {
            setCroppingQueue(prev => [...prev, ...filesToCrop])
        }

        if (filesToUpload.length > 0) {
            await uploadFiles(filesToUpload)
        }

        // Clear input
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    // Process cropping queue
    useEffect(() => {
        if (!currentCroppingFile && croppingQueue.length > 0) {
            const nextFile = croppingQueue[0]
            setCurrentCroppingFile(nextFile)
            setCroppingQueue(prev => prev.slice(1))
            const url = URL.createObjectURL(nextFile)
            setObjectUrl(url)
            setCrop({ x: 0, y: 0 })
            setZoom(1)
        }
    }, [croppingQueue, currentCroppingFile])

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleCropSave = async () => {
        if (!objectUrl || !croppedAreaPixels || !currentCroppingFile) return

        setIsCropping(true)
        try {
            const croppedBlob = await getCroppedImg(objectUrl, croppedAreaPixels)
            if (!croppedBlob) throw new Error("Could not crop image")

            const fileName = currentCroppingFile.name
            const fileType = currentCroppingFile.type
            const croppedFile = new File([croppedBlob], fileName, { type: fileType })

            // Proceed to upload this specific file
            await uploadFiles([croppedFile])

            // Done with this file
            URL.revokeObjectURL(objectUrl)
            setObjectUrl(null)
            setCurrentCroppingFile(null)
        } catch (error) {
            console.error("Cropping error:", error)
            toast.error("Failed to crop image")
        } finally {
            setIsCropping(false)
        }
    }

    const cancelCrop = () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl)
        setObjectUrl(null)
        setCurrentCroppingFile(null)
    }

    const uploadFiles = async (files: File[]) => {
        if (!businessId) {
            toast.error("Business ID is missing. Cannot upload.")
            return
        }

        const newFiles: UploadedFile[] = [...value]

        for (const file of files) {
            const fileId = Math.random().toString(36).substring(7)
            setUploadingFiles(prev => [...prev, { id: fileId, progress: 0, name: file.name }])

            try {
                const currentCount = newFiles.length + 1
                const extension = file.name.split('.').pop() || 'jpg'
                const storagePath = `${businessId}/${path}/banner_${currentCount}_${Date.now()}.${extension}`

                // Upload to Supabase Storage
                const { data, error: storageError } = await supabase.storage
                    .from("events")
                    .upload(storagePath, file, { upsert: true })

                if (storageError) throw storageError

                const { data: { publicUrl } } = supabase.storage.from("events").getPublicUrl(storagePath)

                newFiles.push({
                    url: publicUrl,
                    type: file.type.startsWith("video/") ? "video" : "image"
                })
                if (onChange) onChange([...newFiles])
            } catch (error) {
                console.error("Upload failed for", file.name, error)
                toast.error(`Failed to upload ${file.name}`)
            } finally {
                setUploadingFiles(prev => prev.filter(f => f.id !== fileId))
            }
        }
    }

    const removeImage = async (index: number) => {
        if (disabled) return
        const fileToRemove = value[index]
        if (!fileToRemove) return

        const newFiles = [...value]
        newFiles.splice(index, 1)
        if (onChange) onChange(newFiles)
        if (onRemove) onRemove(index)

        // Delete from Supabase Storage if it's a storage URL
        try {
            // Extract path from public URL: .../storage/v1/object/public/events/PATH
            if (fileToRemove.url.includes("/storage/v1/object/public/events/")) {
                const storagePath = fileToRemove.url.split("/storage/v1/object/public/events/")[1]
                if (storagePath) {
                    const { error: deleteError } = await supabase.storage
                        .from("events")
                        .remove([storagePath])

                    if (deleteError) {
                        console.error("Failed to delete from storage:", deleteError)
                    } else {
                        console.log("Deleted from storage:", storagePath)
                    }
                }
            }
        } catch (err) {
            console.error("Error during storage cleanup:", err)
        }
    }

    const normalizeGoogleDriveUrl = (url: string | null | undefined): string | null => {
        if (!url) return null;
        if (url.includes("drive.google.com/uc")) {
            try {
                const urlObj = new URL(url);
                const fileId = urlObj.searchParams.get("id");
                if (fileId) return `/api/drive/image?id=${fileId}`;
            } catch (e) { }
        }
        return url;
    };

    return (
        <div className={cn("space-y-4", className)}>
            {(label || description) && (
                <div className="space-y-1">
                    {label && (
                        <Label className={cn("text-sm font-semibold", error && "text-destructive")}>
                            {label} {required && <span className="text-destructive">*</span>}
                        </Label>
                    )}
                    {description && <p className="text-xs text-muted-foreground">{description}</p>}
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {/* Existing Images/Videos */}
                {value.map((file, index) => (
                    <div key={index} className="relative group aspect-video rounded-xl overflow-hidden border bg-muted/50 ring-offset-background transition-all hover:ring-2 hover:ring-primary/20">
                        {file.type === "video" ? (
                            <video
                                src={file.url}
                                className="w-full h-full object-cover"
                                controls
                            />
                        ) : (
                            <img
                                src={normalizeGoogleDriveUrl(file.url) || ""}
                                alt={`Upload ${index}`}
                                className="w-full h-full object-cover"
                            />
                        )}

                        {!disabled && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px] pointer-events-none">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8 rounded-full pointer-events-auto"
                                    onClick={() => removeImage(index)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                ))}

                {/* Uploading Statuses */}
                {uploadingFiles.map(file => (
                    <div key={file.id} className="relative aspect-video rounded-xl overflow-hidden border bg-muted/30 flex flex-col items-center justify-center p-3 animate-pulse">
                        <Loader2 className="h-5 w-5 animate-spin text-primary/60 mb-2" />
                        <Progress value={file.progress || 50} className="h-1 w-full max-w-[80%]" />
                        <span className="text-[10px] mt-2 truncate w-full text-center text-muted-foreground">{file.name}</span>
                    </div>
                ))}

                {/* Add Button */}
                {!disabled && (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            "aspect-video rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 py-4 bg-muted/10 group relative",
                            error ? "border-destructive/50 hover:border-destructive" : "border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/5"
                        )}
                    >
                        <div className="p-2 rounded-full bg-background border shadow-sm group-hover:scale-110 transition-transform">
                            <Upload className={cn("h-5 w-5 text-muted-foreground", error ? "group-hover:text-destructive" : "group-hover:text-primary")} />
                        </div>
                        <div className="flex flex-col items-center">
                            <span className={cn("text-xs font-medium text-muted-foreground", error ? "group-hover:text-destructive" : "group-hover:text-primary")}>
                                {value.length > 0 ? "Add More" : "Upload"}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60">Images or Videos</span>
                        </div>
                    </button>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 text-destructive text-xs mt-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{error}</span>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={accept}
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled}
            />

            {/* Cropper Dialog */}
            <Dialog open={!!currentCroppingFile} onOpenChange={(open) => !open && cancelCrop()}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Crop Image: {currentCroppingFile?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="relative w-full h-[400px] bg-black rounded-lg overflow-hidden">
                        {objectUrl && (
                            <Cropper
                                image={objectUrl}
                                crop={crop}
                                zoom={zoom}
                                aspect={aspect ? aspect.width / aspect.height : (typeof dimensions === "object" && dimensions.width && dimensions.height ? dimensions.width / dimensions.height : (dimensions === "square" ? 1 : 16 / 9))}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        )}
                    </div>
                    <div className="flex items-center gap-4 px-2">
                        <ZoomOut className="h-4 w-4 text-muted-foreground" />
                        <Slider
                            value={[zoom]}
                            min={0.1}
                            max={3}
                            step={0.1}
                            onValueChange={(value) => setZoom(value[0])}
                            className="flex-1"
                        />
                        <ZoomIn className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={cancelCrop}>Skip</Button>
                        <Button onClick={handleCropSave} disabled={isCropping}>
                            {isCropping && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crop & Upload
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}


// Helper functions for cropping
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob | null> {
    const image = await createImage(imageSrc)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) return null

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    )

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob)
        }, "image/jpeg")
    })
}

const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image()
        image.addEventListener("load", () => resolve(image))
        image.addEventListener("error", (error) => reject(error))
        image.setAttribute("crossOrigin", "anonymous")
        image.src = url
    })
