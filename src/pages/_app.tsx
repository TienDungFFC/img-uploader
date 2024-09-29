import "@/styles/globals.css";

import type { AppProps } from "next/app";
import Head from "next/head";
import { ToastContainer } from "react-toastify";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Image Uploader | DungNT</title>
      </Head>

      <div className="bg-[#f1ebeb]">
        <ToastContainer
          position="top-right"
          autoClose={3000}
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
        <Component {...pageProps} />
      </div>
    </>
  );
}
