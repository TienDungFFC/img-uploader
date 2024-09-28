import type { FC } from "react";

type ProgressCardProps = {
  progressStatus: number;
};

export const ProgressCard: FC<ProgressCardProps> = ({ progressStatus }) => {
  const width = progressStatus.toString().concat("%");

  return (
    <div className="w-full max-h-[200px] px-8 py-6 flex flex-col gap-4 justify-center items-center bg-white rounded-xl shadow-lg shadow-gray-200/80">
      <h2 className="w-full capitalize text-xl text-left text-gray-700 font-semibold">
        Uploading...
      </h2>

      <div className="w-full flex justify-between items-center">
        <span className="text-sm text-gray-500">Progress</span>
        <span className="text-sm text-gray-700 font-semibold">
          {progressStatus}%
        </span>
      </div>

      <div className="relative w-full h-2 bg-gray-200 rounded-full">
        <div
          className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width }}
        />
      </div>
    </div>
  );
};
