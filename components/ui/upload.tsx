"use client"

import React, { useState, useRef, useEffect } from "react"

import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"

import { Label } from "@/components/ui/label"

import { Card, CardContent } from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"

import { Upload, X, Image as ImageIcon, Loader2, RefreshCw, ZoomIn, ZoomOut, Eye } from "lucide-react"

import Cropper from "react-easy-crop"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"

// Define types locally if not exported
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

import { toast } from "sonner"

import { Progress } from "@/components/ui/progress"



interface ImageUploadProps {

  label: string

  description?: string

  value?: string

  onChange?: (url: string) => void

  onRemove?: () => void

  // Backward compatibility props
  initialImageUrl?: string | null

  onUploadComplete?: (url: string) => void

  maxSize?: number // in MB

  maxSizeMB?: number // Backward compatibility

  dimensions?: {

    width?: number

    height?: number

  } | "square" | "original"

  /**
   * Optional aspect ratio constraint.
   * Example: { width: 43, height: 20 } for a 43:20 ratio.
   * This allows any dimensions that match the ratio (within a small tolerance).
   * If both dimensions and aspect are provided, both must pass validation.
   */
  aspect?: {
    width: number
    height: number
  }

  parentFolder?: string

  childFolder?: string

  imageName?: string

  className?: string

  restriction?: {

    type: string

    value: string

    message?: string

  }

  layoutType?: "layout1" | "layout2"

  // Backward compatibility - path prop
  path?: string
  uploadEndpoint?: string
  disabled?: boolean
  required?: boolean
  accept?: string
  error?: string

}



const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (error) => reject(error))
    image.setAttribute("crossOrigin", "anonymous")
    image.src = url
  })

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation)

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  }
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
): Promise<Blob | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    return null
  }

  const rotRad = getRadianAngle(rotation)

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  )

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth
  canvas.height = bBoxHeight

  // translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(rotRad)
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
  ctx.translate(-image.width / 2, -image.height / 2)

  // draw image
  ctx.drawImage(image, 0, 0)

  // croppedAreaPixels values are bounding box relative
  // extract the cropped image using these values
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  )

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // paste generated rotate image at the top left corner
  ctx.putImageData(data, 0, 0)

  // As a blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      resolve(file)
    }, "image/jpeg")
  })
}


export function ImageUpload({

  label,

  description,

  value: valueProp,

  onChange,

  onRemove,

  // Backward compatibility
  initialImageUrl,

  onUploadComplete,

  maxSize: maxSizeProp,

  maxSizeMB,

  dimensions = "original",

  aspect,

  parentFolder: parentFolderProp,

  childFolder,

  imageName,

  className,

  restriction,

  layoutType = "layout1",

  // Backward compatibility
  path,

  uploadEndpoint = "/api/drive/upload",

  disabled = false,

  required = false,

  accept = "image/*",

  error

}: ImageUploadProps) {
  // Handle backward compatibility
  const value = valueProp ?? initialImageUrl ?? undefined;
  const maxSize = maxSizeProp ?? maxSizeMB ?? 5;

  // Extract parentFolder and childFolder from path if path is provided
  let parentFolder = parentFolderProp;
  if (path && !parentFolder) {
    const pathParts = path.split('/').filter(p => p);
    if (pathParts.length > 0) {
      parentFolder = pathParts[0];
      if (pathParts.length > 1) {
        childFolder = pathParts.slice(1).join('/');
      }
    }
  }

  // If parentFolder is still not set, use a default
  if (!parentFolder) {
    parentFolder = "uploads";
  }

  // Handle onChange/onUploadComplete
  const handleChange = (url: string) => {
    if (onChange) {
      onChange(url);
    }
    if (onUploadComplete) {
      onUploadComplete(url);
    }
  };

  // Helper function to normalize Google Drive URLs
  // Convert Google Drive URLs to use our proxy endpoint to avoid CORS issues
  const normalizeGoogleDriveUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;

    // If it's a Google Drive URL, convert it to use our proxy endpoint
    if (url.includes("drive.google.com/uc")) {
      try {
        const urlObj = new URL(url);
        const fileId = urlObj.searchParams.get("id");
        if (fileId) {
          // Use our proxy endpoint to serve the image
          return `/api/drive/image?id=${fileId}`;
        }
      } catch (e) {
        console.warn("Failed to parse URL:", url);
      }
    }

    return url;
  };

  const [isUploading, setIsUploading] = useState(false)

  const [preview, setPreview] = useState<string | null>(() => {
    // Normalize the initial value (support both value and initialImageUrl for backward compatibility)
    const initialValue = value ?? initialImageUrl ?? null;
    return initialValue ? normalizeGoogleDriveUrl(initialValue) : null;
  })

  const [hasNewSelection, setHasNewSelection] = useState(false) // Track if there's a new image selected but not uploaded

  const [imageInfo, setImageInfo] = useState<{

    dimensions: { width: number; height: number }

    size: string

  } | null>(null)

  const [uploadProgress, setUploadProgress] = useState(0)

  const [uploadSpeed, setUploadSpeed] = useState(0) // bytes per second

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null) // seconds

  const [totalFileSize, setTotalFileSize] = useState(0) // total file size in bytes

  const [loadedBytes, setLoadedBytes] = useState(0) // loaded bytes

  const fileInputRef = useRef<HTMLInputElement>(null)

  const xhrRef = useRef<XMLHttpRequest | null>(null)

  // Cropper state
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isCropperOpen, setIsCropperOpen] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null) // Determine original file type if needed
  const [isCropping, setIsCropping] = useState(false) // Loading state during crop processing

  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const handleCropSave = async () => {
    if (!imageToCrop || !croppedAreaPixels) return

    setIsCropping(true)
    try {
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels)

      if (!croppedBlob) {
        throw new Error("Could not crop image")
      }

      // Create a File from the Blob
      const fileName = originalFile ? originalFile.name : "cropped-image.jpg"
      const fileType = originalFile ? originalFile.type : "image/jpeg"
      const croppedFile = new File([croppedBlob], fileName, { type: fileType })

      // Get new dimensions
      const newDimensions = await getImageDimensions(croppedFile)

      setImageInfo({
        dimensions: newDimensions,
        size: formatFileSize(croppedFile.size)
      })

      // Create preview URL
      const previewUrl = URL.createObjectURL(croppedFile)
      setPreview(previewUrl)

      // Close cropper
      setIsCropperOpen(false)

      // Upload
      setIsUploading(true)
      await uploadWithProgress(croppedFile, newDimensions)

    } catch (error) {
      console.error("Cropping error:", error)
      toast.error("Failed to crop image")
    } finally {
      setIsCropping(false)
      // Cleanup
      if (imageToCrop) {
        // We might want to keep it if we reopen, but usually cleanup is good
        // URL.revokeObjectURL(imageToCrop) // Don't revoke yet as it might be used
      }
    }
  }

  const closeCropper = () => {
    setIsCropperOpen(false)
    setImageToCrop(null)
    setOriginalFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setIsUploading(false)
  }

  // Compute a preview aspect ratio based on the provided dimensions or aspect props.
  // Priority:
  // 1) Explicit dimensions (width & height)
  // 2) "square" keyword
  // 3) aspect ratio prop
  let previewAspectRatio: string | undefined
  if (typeof dimensions === "object" && dimensions?.width && dimensions?.height) {
    previewAspectRatio = `${dimensions.width} / ${dimensions.height}`
  } else if (dimensions === "square") {
    previewAspectRatio = "1 / 1"
  } else if (aspect && aspect.width > 0 && aspect.height > 0) {
    previewAspectRatio = `${aspect.width} / ${aspect.height}`
  }

  // Sync preview with value prop when it changes externally
  useEffect(() => {
    // Support both value and initialImageUrl for backward compatibility
    const currentValue = value ?? initialImageUrl ?? null;
    if (currentValue) {
      const normalizedUrl = normalizeGoogleDriveUrl(currentValue);
      setPreview(normalizedUrl);
      setHasNewSelection(false); // Reset flag when value is set externally (already uploaded)
    } else if (!currentValue && !isUploading) {
      // Only clear preview if value is cleared and we're not uploading
      setPreview(null);
      setHasNewSelection(false);
    }
  }, [value, initialImageUrl, isUploading])

  const formatFileSize = (bytes: number): string => {

    if (bytes === 0) return "0 Bytes"

    const k = 1024

    const sizes = ["Bytes", "KB", "MB", "GB"]

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]

  }

  // Format time remaining in a human-readable format
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.ceil(seconds)}s`;
    } else if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.ceil(seconds % 60);
      return `${mins}m ${secs}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${mins}m`;
    }
  };

  // Format upload speed
  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond < 1024) {
      return `${bytesPerSecond.toFixed(0)} B/s`;
    } else if (bytesPerSecond < 1024 * 1024) {
      return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    } else {
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
    }
  };



  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {

    return new Promise((resolve, reject) => {

      const url = URL.createObjectURL(file)

      const img = new Image()

      img.onload = () => {

        const dimensions = { width: img.naturalWidth, height: img.naturalHeight }

        URL.revokeObjectURL(url)

        resolve(dimensions)

      }

      img.onerror = () => {

        URL.revokeObjectURL(url)

        reject(new Error("Unable to read image dimensions"))

      }

      img.src = url

    })

  }



  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {

    const file = event.target.files?.[0]

    if (!file) return



    // Check restriction if provided

    if (restriction) {

      if (restriction.type === "sku" && (!restriction.value || restriction.value.trim() === "")) {

        toast.error(restriction.message || "Please enter " + restriction.type + " before uploading image")

        return

      }

    }



    // Validate file size

    const maxSizeBytes = maxSize * 1024 * 1024

    if (file.size > maxSizeBytes) {

      toast.error(`File size must be less than ${maxSize}MB`)

      return

    }



    setIsUploading(true)



    try {

      // Get image dimensions for preview

      const imageDimensions = await getImageDimensions(file)



      // Validate dimensions and check if crop is needed
      let needsCrop = false

      if (dimensions === "square" && imageDimensions.width !== imageDimensions.height) {
        needsCrop = true
      } else if (typeof dimensions === "object" && dimensions.width && dimensions.height) {
        // Check for exact dimensions. If not exact, we open cropper.
        if (imageDimensions.width !== dimensions.width || imageDimensions.height !== dimensions.height) {
          needsCrop = true
        }
      }

      // Validate aspect ratio if provided
      if (aspect && aspect.width > 0 && aspect.height > 0) {
        const targetRatio = aspect.width / aspect.height
        const actualRatio = imageDimensions.width / imageDimensions.height

        // Allow a small tolerance for floating point / rounding differences
        const tolerance = 0.01

        if (Math.abs(actualRatio - targetRatio) > tolerance) {
          needsCrop = true
        }
      }

      if (needsCrop) {
        // Instead of erroring, open cropper
        const objectUrl = URL.createObjectURL(file)
        setImageToCrop(objectUrl)
        setOriginalFile(file)
        setIsCropperOpen(true)
        setIsUploading(false)

        // Reset crop state
        setCrop({ x: 0, y: 0 })
        setZoom(1)

        return
      }


      setImageInfo({

        dimensions: imageDimensions,

        size: formatFileSize(file.size)

      })



      // Create preview URL

      const previewUrl = URL.createObjectURL(file)

      setPreview(previewUrl)

      setHasNewSelection(true) // Mark that we have a new selection



      // Upload to Google Drive with progress tracking

      await uploadWithProgress(file, imageDimensions)

      setHasNewSelection(false) // Clear the flag after upload

    } catch (error) {

      console.error("Upload error:", error)

      toast.error(error instanceof Error ? error.message : "Upload failed")

      // Keep preview and hasNewSelection flag on error so user can retry
      // Only clear if it's a validation error (dimensions, size, etc.)
      if (error instanceof Error && (
        error.message.includes("must be") ||
        error.message.includes("File size") ||
        error.message.includes("dimensions")
      )) {
        setPreview(null)
        setImageInfo(null)
        setHasNewSelection(false)
      }
      // Otherwise keep the preview so user can try uploading again

      setUploadProgress(0)

      setUploadSpeed(0)

      setTimeRemaining(null)
      setTotalFileSize(0)
      setLoadedBytes(0)

      setIsUploading(false)

      // Clear the file input

      if (fileInputRef.current) {

        fileInputRef.current.value = ""

      }

    }

  }



  const uploadWithProgress = (file: File, imageDimensions: { width: number; height: number }) => {
    return new Promise<void>((resolve, reject) => {
      // Build the path for Google Drive
      let path = parentFolder;
      if (childFolder) {
        path = `${parentFolder}/${childFolder}`;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", path);

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      let lastLoaded = 0;
      let lastTime = Date.now();

      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
          setTotalFileSize(e.total);
          setLoadedBytes(e.loaded);

          // Calculate upload speed
          const currentTime = Date.now();
          const timeDelta = (currentTime - lastTime) / 1000; // seconds
          const bytesDelta = e.loaded - lastLoaded;

          if (timeDelta > 0) {
            const speed = bytesDelta / timeDelta;
            setUploadSpeed(speed);

            // Calculate time remaining
            const remainingBytes = e.total - e.loaded;
            const estimatedSeconds = remainingBytes / speed;
            setTimeRemaining(estimatedSeconds);
          }

          lastLoaded = e.loaded;
          lastTime = currentTime;
        }
      });

      // Handle completion
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            const normalizedUrl = normalizeGoogleDriveUrl(data.url);
            setUploadProgress(100);
            setUploadSpeed(0);
            setTimeRemaining(null);
            setTotalFileSize(0);
            setLoadedBytes(0);
            setIsUploading(false); // Clear loading state after successful upload
            // Update preview with normalized URL
            setPreview(normalizedUrl);
            setHasNewSelection(false); // Clear new selection flag after successful upload
            handleChange(data.url);
            toast.success("Image uploaded successfully!");
            xhrRef.current = null;
            resolve();
          } catch (err) {
            const errorMsg = "Failed to parse upload response";
            toast.error(errorMsg);
            setIsUploading(false);
            setUploadProgress(0);
            setUploadSpeed(0);
            setTimeRemaining(null);
            setTotalFileSize(0);
            setLoadedBytes(0);
            xhrRef.current = null;
            reject(new Error(errorMsg));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);

            // Handle OAuth authorization required
            if (xhr.status === 401 && errorData.requiresAuth && errorData.authUrl) {
              toast.error("Google Drive authorization required. Redirecting...");
              const currentPath = window.location.pathname;
              window.location.href = `${errorData.authUrl}?redirect=${encodeURIComponent(currentPath)}`;
              setIsUploading(false);
              setUploadProgress(0);
              setUploadSpeed(0);
              setTimeRemaining(null);
              setTotalFileSize(0);
              setLoadedBytes(0);
              xhrRef.current = null;
              return;
            }

            throw new Error(errorData.error || "Failed to upload image");
          } catch (err: any) {
            const errorMsg = err.message || `Upload failed with status ${xhr.status}`;
            toast.error(errorMsg);
            setIsUploading(false);
            setUploadProgress(0);
            setUploadSpeed(0);
            setTimeRemaining(null);
            setTotalFileSize(0);
            setLoadedBytes(0);
            xhrRef.current = null;
            reject(new Error(errorMsg));
          }
        }
      });

      // Handle errors
      xhr.addEventListener("error", () => {
        const errorMsg = "Network error during upload";
        toast.error(errorMsg);
        setIsUploading(false);
        setUploadProgress(0);
        setUploadSpeed(0);
        setTimeRemaining(null);
        setTotalFileSize(0);
        setLoadedBytes(0);
        // Don't clear preview on network error - keep the selected image preview
        xhrRef.current = null;
        reject(new Error(errorMsg));
      });

      // Handle abort
      xhr.addEventListener("abort", () => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadSpeed(0);
        setTimeRemaining(null);
        setTotalFileSize(0);
        setLoadedBytes(0);
        xhrRef.current = null;
        reject(new Error("Upload cancelled"));
      });

      // Start upload
      xhr.open("POST", uploadEndpoint);
      xhr.send(formData);
    });
  };

  const handleRemove = () => {
    // Cancel any ongoing upload
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }

    setPreview(null);
    setImageInfo(null);
    setHasNewSelection(false);
    handleChange("");
    setUploadProgress(0);
    setUploadSpeed(0);
    setTimeRemaining(null);
    setTotalFileSize(0);
    setLoadedBytes(0);
    setIsUploading(false);

    if (onRemove) onRemove();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }



  const handleUploadClick = () => {

    // Check restriction before opening file dialog

    if (restriction) {

      if (restriction.type === "sku" && (!restriction.value || restriction.value.trim() === "")) {

        toast.error(restriction.message || "Please enter SKU before uploading image")

        return

      }

    }

    fileInputRef.current?.click()

  }





  if (layoutType === "layout1") {
    return (
      <div className={className}>
        <Card>
          <CardContent className="px-4 space-y-4">
            {/* Header Section: Label & Desc */}


            <div className="flex items-start gap-4">
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Left Col: Image Preview / Placeholder */}
              <div className="relative group shrink-0">
                {(preview || value) ? (
                  <div
                    className="relative cursor-pointer group rounded-md overflow-hidden"
                    onClick={!isUploading ? handleUploadClick : undefined}
                  >
                    <img
                      src={preview || (value ? normalizeGoogleDriveUrl(value) : "") || ""}
                      alt="Preview"
                      className="w-24 h-24 object-contain rounded-md border bg-muted"
                      style={previewAspectRatio ? { aspectRatio: previewAspectRatio } : undefined}
                      onError={(e) => {
                        const currentSrc = preview || value;
                        console.warn("Failed to load image:", currentSrc);
                        const img = e.target as HTMLImageElement;
                        if (!currentSrc) return;
                        if (currentSrc.includes("/api/drive/image")) {
                          try {
                            const urlObj = new URL(currentSrc, window.location.origin);
                            const fileId = urlObj.searchParams.get("id");
                            if (fileId) {
                              const tryThumbnail = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
                              img.src = tryThumbnail;
                            }
                          } catch (err) {
                            console.error("Error parsing proxy URL:", err);
                          }
                        } else if (currentSrc.includes("drive.google.com/uc")) {
                          try {
                            const urlObj = new URL(currentSrc);
                            const fileId = urlObj.searchParams.get("id");
                            if (fileId) {
                              img.src = `/api/drive/image?id=${fileId}`;
                            }
                          } catch (err) {
                            console.warn("Failed to parse URL:", currentSrc);
                          }
                        }
                      }}
                    />
                    {/* Hover Overlay for Actions */}
                    {!isUploading && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-white hover:text-white hover:bg-white/20 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(preview || (value ? normalizeGoogleDriveUrl(value) : "") || "", "_blank");
                          }}
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-white hover:text-white hover:bg-white/20 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUploadClick();
                          }}
                          title="Change"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-white hover:text-white hover:bg-white/20 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove();
                          }}
                          title="Remove"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/40 rounded-md flex items-center justify-center backdrop-blur-sm">
                        <div className="flex flex-col items-center justify-center gap-1 w-full">
                          <div className="relative w-10 h-10 flex items-center justify-center">
                            <svg className="w-10 h-10 transform -rotate-90 absolute top-0 left-0" viewBox="0 0 64 64">
                              <circle cx="32" cy="32" r="28" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="4" fill="none" />
                              <circle cx="32" cy="32" r="28" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 28}`} strokeDashoffset={`${2 * Math.PI * 28 * (1 - uploadProgress / 100)}`} className="transition-all duration-300" />
                            </svg>
                            <span className="text-white text-[10px] font-semibold relative z-10 leading-none">{uploadProgress.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    onClick={handleUploadClick}
                    className="w-24 h-24 bg-muted/30 rounded-md border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-5 w-5 text-muted-foreground/60 mb-1 animate-spin" />
                        <span className="text-[10px] text-muted-foreground/60 font-medium">Preparing...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-muted-foreground/60 mb-1" />
                        <span className="text-[10px] text-muted-foreground/60 font-medium">Upload</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Right Col: Stats & Actions */}
              <div className="flex-1 flex flex-col justify-center min-h-[96px] gap-2">
                <div className="space-y-1">
                  <Label >{label}</Label>
                  {description && (
                    <p className="text-xs text-muted-foreground">{description}</p>
                  )}
                  {/* SKU Restriction Msg */}
                  {restriction && restriction.type === "sku" && (!restriction.value || restriction.value.trim() === "") && (
                    <p className="text-xs text-destructive">
                      {restriction.message || "Enter SKU to enable upload"}
                    </p>
                  )}
                </div>
                {/* Metadata */}
                <div className="space-y-1">
                  {imageInfo ? (
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">{imageInfo.dimensions.width} x {imageInfo.dimensions.height}</p>
                      <p>{imageInfo.size}</p>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      <p>{dimensions === "square" ? "Square image" : typeof dimensions === "object" ? `${dimensions.width || "any"} × ${dimensions.height || "any"}px` : (aspect && aspect.width && aspect.height) ? `Aspect Ratio: ${aspect.width}:${aspect.height}` : "Any dimensions"}</p>
                      <p>Max: {maxSize}MB</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {(preview || value) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 hidden"
                      onClick={handleRemove}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CROPPER DIALOG */}
        <Dialog open={isCropperOpen} onOpenChange={(open) => {
          if (!open) closeCropper()
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crop Image</DialogTitle>
            </DialogHeader>
            <div className="relative w-full h-[400px] bg-black">
              {imageToCrop && (
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  minZoom={0.1}
                  restrictPosition={false}
                  aspect={
                    dimensions === "square"
                      ? 1
                      : (typeof dimensions === "object" && dimensions.width && dimensions.height)
                        ? dimensions.width / dimensions.height
                        : (aspect && aspect.width && aspect.height)
                          ? aspect.width / aspect.height
                          : 1 // Default to square if no aspect/dimensions
                  }
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              )}
            </div>
            <div className="flex items-center gap-4 py-2">
              <ZoomOut className="h-4 w-4" />
              <Slider
                value={[zoom]}
                min={0.1}
                max={3}
                step={0.1}
                onValueChange={(value) => setZoom(value[0])}
              />
              <ZoomIn className="h-4 w-4" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeCropper}>Cancel</Button>
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



  if (layoutType === "layout2") {

    return (

      <div className={`space-y-4 ${className}`}>



        <Label className="text-sm font-medium">{label}</Label>





        <div className="flex gap-4">

          {/* First Image Circle */}

          <div className="relative">

            <div

              className="w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/25 cursor-pointer hover:border-muted-foreground/50 transition-colors flex items-center justify-center overflow-hidden"

              onClick={handleUploadClick}

            >

              {(preview || value) ? (

                <img

                  src={preview || (value ? normalizeGoogleDriveUrl(value) : "") || ""}

                  alt="Preview"

                  className="w-full h-full object-cover rounded-full"

                  onError={(e) => {

                    const currentSrc = preview || value;
                    console.warn("Failed to load image:", currentSrc);
                    const img = e.target as HTMLImageElement;

                    if (!currentSrc) return;

                    // If it's already using our proxy and fails, try thumbnail format as fallback
                    if (currentSrc.includes("/api/drive/image")) {
                      try {
                        const urlObj = new URL(currentSrc, window.location.origin);
                        const fileId = urlObj.searchParams.get("id");

                        if (fileId) {
                          // Try thumbnail format as last resort
                          const tryThumbnail = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
                          img.src = tryThumbnail;
                        }
                      } catch (err) {
                        console.error("Error parsing proxy URL:", err);
                      }
                    } else if (currentSrc.includes("drive.google.com/uc")) {
                      // If it's a direct Google Drive URL, convert to proxy
                      try {
                        const urlObj = new URL(currentSrc);
                        const fileId = urlObj.searchParams.get("id");

                        if (fileId) {
                          img.src = `/api/drive/image?id=${fileId}`;
                        }
                      } catch (err) {
                        console.error("Error parsing Google Drive URL:", err);
                      }
                    }
                  }}

                />

              ) : (

                <div className="text-center">

                  <Upload className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1" />

                  <span className="text-xs text-muted-foreground/50">Upload</span>

                </div>

              )}

            </div>



            {/* Delete Icon */}

            {(preview || value) && (

              <button

                type="button"

                onClick={handleRemove}

                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"

              >

                <X className="h-3 w-3" />

              </button>

            )}



            {/* Upload Loading State */}

            {isUploading && (

              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">

                <Loader2 className="h-6 w-6 text-white animate-spin" />

              </div>

            )}

          </div>



        </div>



        {/* Hidden File Input */}

        <Input

          ref={fileInputRef}

          type="file"

          accept="image/*"

          onChange={handleFileSelect}

          className="hidden"

        />

        {/* Image Info */}



        <div className="text-xs text-muted-foreground space-y-1">

          {imageInfo ? (

            <>

              <div>Dimensions: {imageInfo.dimensions.width} × {imageInfo.dimensions.height}px</div>

              <div>Size: {imageInfo.size}</div>

            </>

          ) : (

            <>

              <div>Required Dimensions: {dimensions === "square" ? "Square image" :

                typeof dimensions === "object" ?

                  `${dimensions.width || "any"} × ${dimensions.height || "any"}px` :

                  (aspect && aspect.width && aspect.height) ? `Aspect Ratio: ${aspect.width}:${aspect.height}` :

                    "Any dimensions"}</div>

              <div>Max allowed: {maxSize}MB</div>

            </>

          )}





        </div>

        {/* CROPPER DIALOG */}
        <Dialog open={isCropperOpen} onOpenChange={(open) => {
          if (!open) closeCropper()
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crop Image</DialogTitle>
            </DialogHeader>
            <div className="relative w-full h-[400px] bg-black">
              {imageToCrop && (
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  minZoom={0.1}
                  restrictPosition={false}
                  aspect={
                    dimensions === "square"
                      ? 1
                      : (typeof dimensions === "object" && dimensions.width && dimensions.height)
                        ? dimensions.width / dimensions.height
                        : (aspect && aspect.width && aspect.height)
                          ? aspect.width / aspect.height
                          : 1 // Default to square if no aspect/dimensions
                  }
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              )}
            </div>
            <div className="flex items-center gap-4 py-2">
              <ZoomOut className="h-4 w-4" />
              <Slider
                value={[zoom]}
                min={0.1}
                max={3}
                step={0.1}
                onValueChange={(value) => setZoom(value[0])}
              />
              <ZoomIn className="h-4 w-4" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeCropper}>Cancel</Button>
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

  // Default return to handle end of function if not returned early (though layout1/layout2 returns)
  // But we need to add the Dialog for layout1 too!
  // Since layout1 returns earlier, I will append the Dialog to layout1 return OR move Dialog out.
  // Actually, wait, the layout returns are inside `if`. I should inject Dialog into layout1 as well.

  return null; // Should not reach here if layoutType is valid
}
