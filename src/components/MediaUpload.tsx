import React, { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface MediaUploadProps {
  images: string[];
  videos: { url: string; thumbnailTime: number }[];
  primaryImage: number;
  onImagesChange: (images: string[]) => void;
  onVideosChange: (videos: { url: string; thumbnailTime: number }[]) => void;
  onPrimaryChange: (index: number) => void;
  userRole: 'vendor' | 'couple';
  onUploadError?: (hasError: boolean) => void; // Callback to notify parent of upload errors
}

const MAX_IMAGES = 25;
const MAX_VIDEOS = 5;
const MAX_IMAGE_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_VIDEO_SIZE = 250 * 1024 * 1024; // 250MB

const MediaUpload = ({
  images = [],
  videos = [],
  primaryImage = 0,
  onImagesChange,
  onVideosChange,
  onPrimaryChange,
  userRole,
  onUploadError,
}: MediaUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ [key: string]: number }>({});
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setUploading(true);
    setUploadErrors([]); // Reset errors

    const files = Array.from(e.target.files);
    const newImages = [...images];
    const newVideos = [...videos];
    let allSuccessful = true;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      for (const file of files) {
        const fileSizeMB = file.size;
        const fileType = file.type.toLowerCase();
        const isImage = fileType.startsWith('image/');
        const isVideo = fileType.startsWith('video/');

        if (!isImage && !isVideo) {
          toast.error(`${file.name} is not an image or video`);
          setUploadErrors((prev) => [...prev, `${file.name} is not an image or video`]);
          allSuccessful = false;
          continue;
        }
        if (isImage && fileSizeMB > MAX_IMAGE_SIZE) {
          toast.error(`${file.name} exceeds 25MB limit`);
          setUploadErrors((prev) => [...prev, `${file.name} exceeds 25MB limit`]);
          allSuccessful = false;
          continue;
        }
        if (isVideo && fileSizeMB > MAX_VIDEO_SIZE) {
          toast.error(`${file.name} exceeds 250MB limit`);
          setUploadErrors((prev) => [...prev, `${file.name} exceeds 250MB limit`]);
          allSuccessful = false;
          continue;
        }
        if (isImage && !['image/jpeg', 'image/png'].includes(fileType)) {
          toast.error(`${file.name} must be JPG or PNG`);
          setUploadErrors((prev) => [...prev, `${file.name} must be JPG or PNG`]);
          allSuccessful = false;
          continue;
        }
        if (isVideo && !['video/mp4', 'video/quicktime', 'video/mpeg'].includes(fileType)) {
          toast.error(`${file.name} must be MP4, MOV, or MPEG`);
          setUploadErrors((prev) => [...prev, `${file.name} must be MP4, MOV, or MPEG`]);
          allSuccessful = false;
          continue;
        }
        if (isImage && newImages.length >= MAX_IMAGES) {
          toast.error(`Max ${MAX_IMAGES} images reached`);
          setUploadErrors((prev) => [...prev, `Max ${MAX_IMAGES} images reached`]);
          allSuccessful = false;
          break;
        }
        if (isVideo && newVideos.length >= MAX_VIDEOS) {
          toast.error(`Max ${MAX_VIDEOS} videos reached`);
          setUploadErrors((prev) => [...prev, `Max ${MAX_VIDEOS} videos reached`]);
          allSuccessful = false;
          break;
        }

        const filePath = `${user.id}/${Date.now()}-${file.name}`;
        const bucket = isImage ? `${userRole}-images` : `${userRole}-videos`;

        setProgress((prev) => ({ ...prev, [file.name]: 0 }));
        // Simulate progress (since Supabase JS doesn't support onUploadProgress yet)
        const simulateProgress = setInterval(() => {
          setProgress((prev) => ({
            ...prev,
            [file.name]: Math.min((prev[file.name] || 0) + 10, 90),
          }));
        }, 500);

        const { error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            upsert: true,
            cacheControl: '3600',
            contentType: fileType,
          });

        clearInterval(simulateProgress);

        if (error) {
          console.error(`[UPLOAD] Error for ${file.name}:`, error);
          toast.error(`Failed to upload ${file.name}: ${error.message}`);
          setUploadErrors((prev) => [...prev, `Failed to upload ${file.name}: ${error.message}`]);
          setProgress((prev) => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
          allSuccessful = false;
          continue;
        }

        setProgress((prev) => ({ ...prev, [file.name]: 100 }));
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
        if (isImage) {
          newImages.push(urlData.publicUrl);
        } else {
          newVideos.push({ url: urlData.publicUrl, thumbnailTime: 0 });
        }
      }

      onImagesChange(newImages);
      onVideosChange(newVideos);
      if (newImages.length > 0 && images.length === 0) onPrimaryChange(0);

      // Only update the database if uploads are successful
      if (allSuccessful) {
        const table = userRole === 'vendor' ? 'vendors' : 'couples';
        const { error: updateError } = await supabase
          .from(table)
          .update({
            images: newImages,
            videos: newVideos,
            primary_image: primaryImage,
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('[UPLOAD] DB update error:', updateError);
          toast.error('Failed to save changes');
          setUploadErrors((prev) => [...prev, 'Failed to save media changes']);
          allSuccessful = false;
        } else {
          toast.success('Media uploaded successfully');
        }
      }
    } catch (error: any) {
      console.error('[UPLOAD] General error:', error);
      toast.error('Upload failed: ' + (error.message || 'Unknown error'));
      setUploadErrors((prev) => [...prev, 'Upload failed: ' + (error.message || 'Unknown error')]);
      allSuccessful = false;
    } finally {
      setUploading(false);
      if (allSuccessful) setTimeout(() => setProgress({}), 1000);
      // Notify parent of upload errors
      if (onUploadError) onUploadError(!allSuccessful);
    }
  };

  const handleRemove = async (url: string, isImage: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const table = userRole === 'vendor' ? 'vendors' : 'couples';
      let newImages = images;
      let newVideos = videos;

      if (isImage) {
        newImages = images.filter((img) => img !== url);
        onImagesChange(newImages);
        if (primaryImage >= newImages.length) onPrimaryChange(0);
      } else {
        newVideos = videos.filter((vid) => vid.url !== url);
        onVideosChange(newVideos);
      }

      const { error } = await supabase
        .from(table)
        .update({
          images: newImages,
          videos: newVideos,
          primary_image: primaryImage,
        })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Media removed successfully');
    } catch (error: any) {
      console.error('[REMOVE] Error:', error);
      toast.error('Failed to remove media: ' + (error.message || 'Unknown error'));
      setUploadErrors((prev) => [...prev, 'Failed to remove media: ' + (error.message || 'Unknown error')]);
      if (onUploadError) onUploadError(true);
    }
  };

  const handlePrimaryChange = async (index: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      onPrimaryChange(index);
      const table = userRole === 'vendor' ? 'vendors' : 'couples';
      const { error } = await supabase
        .from(table)
        .update({ primary_image: index })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Primary image updated');
    } catch (error: any) {
      console.error('[PRIMARY] Error:', error);
      toast.error('Failed to update primary image: ' + (error.message || 'Unknown error'));
      setUploadErrors((prev) => [...prev, 'Failed to update primary image: ' + (error.message || 'Unknown error')]);
      if (onUploadError) onUploadError(true);
    }
  };

  const handleThumbnailChange = async (videoUrl: string, time: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const newVideos = videos.map((vid) =>
        vid.url === videoUrl ? { ...vid, thumbnailTime: time } : vid
      );
      onVideosChange(newVideos);

      const table = userRole === 'vendor' ? 'vendors' : 'couples';
      const { error } = await supabase
        .from(table)
        .update({ videos: newVideos })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Thumbnail updated');
    } catch (error: any) {
      console.error('[THUMBNAIL] Error:', error);
      toast.error('Failed to update thumbnail: ' + (error.message || 'Unknown error'));
      setUploadErrors((prev) => [...prev, 'Failed to update thumbnail: ' + (error.message || 'Unknown error')]);
      if (onUploadError) onUploadError(true);
    }
  };

  return (
    <DragDropContext
      onDragEnd={(result) => {
        if (!result.destination) return;
        const newImages = Array.from(images);
        const [reordered] = newImages.splice(result.source.index, 1);
        newImages.splice(result.destination.index, 0, reordered);
        onImagesChange(newImages);
        if (primaryImage === result.source.index) handlePrimaryChange(result.destination.index);
      }}
    >
      <div className="space-y-4">
        {uploadErrors.length > 0 && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            <p className="font-bold">Upload Errors:</p>
            <ul className="list-disc list-inside">
              {uploadErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload Media</label>
          <input
            type="file"
            accept="image/jpeg,image/png,video/mp4,video/quicktime,video/mpeg"
            multiple
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id="media-upload"
          />
          <label
            htmlFor="media-upload"
            className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-primary"
          >
            <Upload className="w-6 h-6 mr-2" />
            {uploading ? 'Uploading...' : 'Drop or click to upload images/videos'}
          </label>
        </div>

        {Object.keys(progress).length > 0 && (
          <div className="space-y-2">
            {Object.entries(progress).map(([fileName, percent]) => (
              <div key={fileName} className="space-y-1">
                <div className="text-sm">{fileName}</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {images.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Images ({images.length}/{MAX_IMAGES})</h3>
            <Droppable droppableId="images" direction="horizontal">
              {(provided) => (
                <div
                  className="grid grid-cols-2 md:grid-cols-4 gap-4"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {images.map((url, index) => (
                    <Draggable key={url} draggableId={url} index={index}>
                      {(provided) => (
                        <div
                          className="relative"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <img
                            src={`${url}?auto=format&fit=crop&w=400&q=75`}
                            alt={`Upload ${index}`}
                            className={`w-full h-32 object-cover rounded-md ${index === primaryImage ? 'border-4 border-primary' : 'border border-gray-300'}`}
                            loading="lazy"
                            onClick={() => handlePrimaryChange(index)}
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(url, true);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          {index === primaryImage && (
                            <span className="absolute bottom-1 left-1 bg-primary text-white px-2 py-1 rounded text-xs">Primary</span>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        )}

        {videos.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Videos ({videos.length}/{MAX_VIDEOS})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map((vid) => (
                <div key={vid.url} className="relative space-y-2">
                  <video
                    ref={(el) => (videoRefs.current[vid.url] = el)}
                    src={vid.url}
                    controls
                    className="w-full h-32 object-cover rounded-md border border-gray-300"
                    loading="lazy"
                    onLoadedMetadata={(e) => {
                      const video = e.target as HTMLVideoElement;
                      video.currentTime = vid.thumbnailTime || 0;
                    }}
                  />
                  <input
                    type="range"
                    min="0"
                    max={videoRefs.current[vid.url]?.duration || 100}
                    value={vid.thumbnailTime || 0}
                    onChange={(e) => {
                      const time = parseFloat(e.target.value);
                      if (videoRefs.current[vid.url]) {
                        videoRefs.current[vid.url]!.currentTime = time;
                      }
                      handleThumbnailChange(vid.url, time);
                    }}
                    className="w-full"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1"
                    onClick={() => handleRemove(vid.url, false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DragDropContext>
  );
};

export default MediaUpload;