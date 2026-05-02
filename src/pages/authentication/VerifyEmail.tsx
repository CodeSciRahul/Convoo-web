import { useEffect, useState} from "react";
import correct from "@/assets/correct.png";
import failed from "@/assets/delete.png"
import { useNavigate } from "react-router-dom";
import Confetti from 'react-confetti';
import { verifyUser } from "@/services/apiService";
import { useSearchParams } from "react-router-dom";
import { AxiosResponse } from 'axios';
import { AxiosError } from "axios";
import { Helmet } from "react-helmet-async";

export const VerifyUserByEmailLink = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isLoading, setisLoading] = useState<boolean>(false)
  const [isverified, setisverified] = useState<boolean | null>(null);
  const [message, setmessage] = useState<string>("");

  const token: string | null = searchParams.get('token'); 
  useEffect(() => {
    const verifyUserHandler = async () => {
        setisLoading(true)
      try {
        const response: AxiosResponse = await verifyUser(token);
          setisverified(true);
          setmessage(response?.data?.message);
          setTimeout(() => {
            navigate("/login");
          }, 3000);
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          setisverified(false);
          console.log(err);
          setmessage(`${err?.response?.data?.message}`);
        } 
       
      } finally {
        setisLoading(false)
      }
    };

    verifyUserHandler();
  }, [token, navigate]);

  return (
    <>
      <Helmet>
        <title>Verify email | Convoo</title>
        <meta
          name="description"
          content="Verify your Convoo account email to start chatting."
        />
        <meta property="og:title" content="Verify email | Convoo" />
        <meta
          property="og:description"
          content="Verify your Convoo account email to start chatting."
        />
        <meta property="og:type" content="website" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {isLoading && <p className="text-center"> Loading...</p>}
      <div className="fixed inset-0 flex justify-center items-center flex-col bg-black bg-opacity-50 z-20">
        {isverified !== null && (
          <img
            className="w-[120px] animate-pulse"
            src={isverified ? correct : failed}
            alt={isverified ? "Verified" : "Failed"}
          />
        )}

        <div
          className={`mt-10 text-2xl ${
            isverified === true ? "text-green-800" : "text-red-800"
          }`}
        >
          {message}
        </div>

        {isverified && (
            <Confetti 
            width={window.innerWidth}
            height={window.innerHeight} 
            recycle={true}
            />)}
      </div>
    </>
  );
};
