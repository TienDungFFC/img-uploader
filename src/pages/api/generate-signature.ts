import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { public_id, eager, timestamp } = req.body;

  // Lấy API secret từ biến môi trường
  const api_secret = process.env.CLOUDINARY_API_SECRET || "";

  if (!api_secret) {
    return res.status(500).json({ message: "API Secret is missing" });
  }

  // Bước 1: Tạo chuỗi tham số cần ký
  const params_to_sign = `eager=${eager}&public_id=${public_id}&timestamp=${timestamp}`;

  // Bước 2: Ghép chuỗi tham số với API secret
  const string_to_sign = `${params_to_sign}${api_secret}`;

  // Bước 3: Tạo chữ ký (signature) bằng thuật toán mã hóa SHA-1
  const signature = crypto
    .createHash("sha1")
    .update(string_to_sign)
    .digest("hex");

  // Trả về chữ ký trong phản hồi JSON
  res.status(200).json({ signature });
}
