import { ButtonFile } from "@/components/ButtonFile";
import { InputLink } from "@/components/InputLink";
import { ProgressCard } from "@/components/ProcessCard";
import { Dropzone } from "@/components/Dropzone";
import { PreviewImage } from "@/components/PreviewImage";
import type { DropzoneOptions } from "react-dropzone";
import { ToastContainer } from "react-toastify";
import type { NextPage } from "next";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";
import axios from "axios";

type ImageRes = {
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

type ImageResponse = {
  public_id: string;
  secure_url: string;
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
  const [formatImage, setFormatImage] = useState<FormData | null>(null);
  const [image, setImage] = useState<ImageRes | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [progressStatus, setProgressStatus] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const getSignature = async (
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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;

    const formData = new FormData();
    formData.append("file", acceptedFiles[0]);
    const public_id = "sample_image";
    const eager = "w_400,h_300,c_pad|w_260,h_200,c_crop";
    const timestamp = Math.floor(Date.now() / 1000); // Thời gian hiện tại tính bằng giây

    // Gọi API để lấy signature từ server-side
    try {
      const signature = await getSignature(public_id, eager, timestamp);
      formData.append("timestamp", timestamp.toString());
      formData.append("api_key", "984541594185533");
      formData.append("signature", signature);
      formData.append("public_id", public_id);
      formData.append("eager", eager);

      setFormatImage(formData);
    } catch (error) {
      toast.error("Failed to generate signature");
    }
  }, []);

  const onChangeFile = async (
    e: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const files = e.target?.files;

    if (!files || files.length === 0) return;

    const file = files[0];

    // Kiểm tra loại file có hợp lệ hay không (chỉ cho phép image)
    if (!file?.type.match(imageTypeRegex)) {
      toast.error("File type must be .png,.jpg,.jpeg,.gif", {
        theme: "light",
      });
      return;
    }

    // Tạo formData và thêm file vào
    const formData = new FormData();
    formData.append("file", file);

    const public_id = "sample_image";
    const eager = "w_400,h_300,c_pad|w_260,h_200,c_crop";
    const timestamp = Math.floor(Date.now() / 1000); // Thời gian hiện tại tính bằng giây

    try {
      // Gọi API để lấy signature từ server-side
      const response = await axios.post("/api/generate-signature", {
        public_id,
        eager,
        timestamp,
      });

      const signature = response.data.signature;

      // Thêm các tham số khác vào formData
      formData.append("timestamp", timestamp.toString());
      formData.append(
        "api_key",
        process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || ""
      );
      formData.append("signature", signature);
      formData.append("public_id", public_id);
      formData.append("eager", eager);

      // Cập nhật state với formData để tiếp tục upload
      setFormatImage(formData);
    } catch (error) {
      // Hiển thị lỗi nếu không thể lấy signature
      toast.error("Failed to generate signature");
    }
  };

  const { getRootProps, getInputProps, fileRejections, isDragActive } =
    useDropzone({ ...DROPZONE_OPTIONS, onDrop });

  useEffect(() => {
    (async () => {
      if (!formatImage) return;

      try {
        setIsFetching(true);
        for (const pair of formatImage.entries()) {
          console.log(pair[0], pair[1]); // In ra từng cặp key-value trong FormData
        }
        const data = await uploadFile({
          formData: formatImage,
          onUploadProgress(progress: any) {
            setProgressStatus(progress);
          },
        });

        if (data) {
          setFormatImage(null);
          setImage(data);
          setIsFetching(false);
          setIsSuccess(true);
          toast.success("Successfully uploaded!");
        }
      } catch (err) {
        if (axios.isAxiosError<{ message: string }>(err)) {
          toast.error(err.response?.data.message);
        }
        if (err instanceof Error) {
          toast.error(err.message);
        }
        setFormatImage(null);
        setImage(null);
        setIsFetching(false);
        setIsSuccess(false);
      }
    })();
  }, [formatImage]);

  return (
    <>
      <ToastContainer
        position="bottom-center"
        autoClose={5000}
        limit={2}
        hideProgressBar
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <div>
        {!isFetching && (
          <div
            {...getRootProps({ className: "dropzone" })}
            className="w-full sm:w-[402px] h-[469px] p-8 bg-slate-50 sm:bg-white rounded-xl shadow-none sm:shadow-lg sm:shadow-gray-200/80"
          >
            <div className="w-full h-full flex gap-6 flex-col justify-evenly items-center">
              {isSuccess && (
                <i className="fa-sharp fa-solid fa-circle-check text-4xl text-green-600"></i>
              )}

              <h2 className="text-xl text-gray-600 text-center font-semibold">
                {isSuccess ? "Uploaded Successfully!" : "Upload your image"}
              </h2>

              {!isSuccess && (
                <p className="text-xs sm:text-sm text-gray-500 text-center font-medium">
                  File should be Jpeg, Png, Gif
                </p>
              )}

              {image ? (
                <PreviewImage imageUrl={image.secure_url} />
              ) : (
                <Dropzone
                  isActive={isDragActive}
                  onInputProps={getInputProps}
                />
              )}

              {!isSuccess && (
                <span className="text-xs text-gray-400 font-medium">Or</span>
              )}

              {!isSuccess && (
                <ButtonFile
                  onClick={() => inputRef.current?.click()}
                  inputRef={inputRef}
                  onChange={onChangeFile}
                />
              )}

              {isSuccess && <InputLink value={image?.secure_url ?? ""} />}
            </div>
          </div>
        )}

        {isFetching && <ProgressCard progressStatus={progressStatus} />}
      </div>
    </>
  );
};

export default HomePage;
