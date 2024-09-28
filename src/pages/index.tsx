import { FileButton } from "@/components/ButtonFile";
import { InputLink } from "@/components/InputLink";
import { ProgressCard } from "@/components/ProcessCard";
import { Dropzone } from "@/components/Dropzone";
import { PreviewImage } from "@/components/PreviewImage";
import type { DropzoneOptions } from "react-dropzone";
import type { NextPage } from "next";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";

type ImageResponse = {
  public_id: string;
  secure_url: string;
};

const imageTypeRegex = /image\/(png|gif|jpg|jpeg)/gm;
const DROPZONE_OPTIONS: DropzoneOptions = {
  accept: {
    "image/*": [".png", ".jpg", ".jpeg", ".gif"],
  },
  noClick: true,
  maxFiles: 1,
  maxSize: 11000000,
};

type UploadFileProps = {
  formData: FormData | null;
  onUploadProgress: (progress: number) => void;
};

export const uploadFile = async ({
  formData,
  onUploadProgress,
}: UploadFileProps): Promise<ImageResponse> => {
  const { data } = await axios.request<ImageResponse>({
    method: "POST",
    headers: { "Content-Type": "multipart/form-data" },
    url: process.env.NEXT_PUBLIC_CLOUDINARY_BASE_URL || "",
    data: formData,
    onUploadProgress(progressEvent) {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total!
      );
      onUploadProgress(percentCompleted);
    },
  });

  return { secure_url: data.secure_url, public_id: data.public_id };
};

const HomePage: NextPage = () => {
  const [selectedImage, setSelectedImage] = useState<FormData | null>(null);
  const [uploadedImages, setUploadedImages] = useState<ImageResponse[]>([]); // Chứa danh sách các ảnh đã upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSignature = async (
    public_id: string,
    eager: string,
    timestamp: number
  ) => {
    try {
      const response = await axios.post("/api/generate-signature", {
        public_id,
        eager,
        timestamp,
      });
      return response.data.signature;
    } catch (error) {
      console.error("Error generating signature:", error);
      throw new Error("Failed to generate signature");
    }
  };

  const prepareFormData = async (file: File) => {
    const formData = new FormData();
    const public_id = `${file.name.split(".")[0]}_${Math.floor(
      Date.now() / 1000
    )}`;
    const eager = "w_400,h_300,c_pad|w_260,h_200,c_crop";
    const timestamp = Math.floor(Date.now() / 1000);

    try {
      const signature = await fetchSignature(public_id, eager, timestamp);
      formData.append("file", file);
      formData.append("timestamp", timestamp.toString());
      formData.append(
        "api_key",
        process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || ""
      );
      formData.append("signature", signature);
      formData.append("public_id", public_id);
      formData.append("eager", eager);

      return formData;
    } catch (error) {
      toast.error("Failed to generate signature");
      throw error;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;

    try {
      const formData = await prepareFormData(acceptedFiles[0]);
      setSelectedImage(formData);
    } catch (error) {
      toast.error("Error preparing file for upload");
    }
  }, []);

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target?.files;

    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file?.type.match(imageTypeRegex)) {
      toast.error("File type must be .png,.jpg,.jpeg,.gif", {
        theme: "light",
      });
      return;
    }

    try {
      const formData = await prepareFormData(file);
      setSelectedImage(formData);
    } catch (error) {
      toast.error("Error preparing file for upload");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    ...DROPZONE_OPTIONS,
    onDrop,
  });

  useEffect(() => {
    (async () => {
      if (!selectedImage) return;

      try {
        setIsUploading(true);
        const data = await uploadFile({
          formData: selectedImage,
          onUploadProgress(progress: any) {
            setUploadProgress(progress);
          },
        });

        if (data) {
          setSelectedImage(null);
          setUploadedImages((prevImages) => [...prevImages, data]); // Lưu hình ảnh đã upload vào danh sách
          setIsUploading(false);
          toast.success("Successfully uploaded!");
        }
      } catch (err) {
        if (axios.isAxiosError<{ message: string }>(err)) {
          toast.error(err.response?.data.message);
        } else if (err instanceof Error) {
          toast.error(err.message);
        }
        setSelectedImage(null);
        setIsUploading(false);
      }
    })();
  }, [selectedImage]);

  return (
    <div className="lg:max-w-screen-lg m-auto flex justify-center items-center h-[100vh]">
      <div className="w-full m-auto sm:w-[402px] h-auto p-8 bg-slate-50 sm:bg-white rounded-xl shadow-none sm:shadow-lg sm:shadow-gray-200/80">
        {!isUploading && (
          <div {...getRootProps({ className: "dropzone" })} className="w-full">
            <div className="w-full h-full flex gap-6 flex-col justify-evenly items-center">
              <h2 className="text-xl text-gray-600 text-center font-semibold">
                Upload your image
              </h2>

              <Dropzone isActive={isDragActive} onInputProps={getInputProps} />

              <FileButton
                onClick={() => fileInputRef.current?.click()}
                inputRef={fileInputRef}
                onChange={onFileChange}
              />
            </div>
          </div>
        )}

        {isUploading && <ProgressCard progressStatus={uploadProgress} />}

        {uploadedImages.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg text-gray-600 font-semibold text-center">
              Uploaded Images
            </h3>
            <div className="grid grid-cols-1 gap-4 mt-4">
              {uploadedImages.map((image, index) => (
                <div key={index}>
                  <PreviewImage imageUrl={image.secure_url} />
                  <InputLink value={image.secure_url} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
