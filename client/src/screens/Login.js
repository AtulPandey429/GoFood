import React, { useState, useEffect } from "react";

import { Link, useNavigate, useSearchParams } from "react-router-dom";

import API_BASE_URL from "../config";

import ApiClient from "../factories/api/ApiClient";

import { useAuth } from "../contexts/AuthContext";

import { useWallet } from "../hooks/useWallet";

import TelegramLoginWidget from "../components/TelegramLoginWidget";



const Login = () => {

  const [credential, setCredential] = useState({ email: "", password: "" });

  const [error, setError] = useState("");

  const [sandboxMode, setSandboxMode] = useState(true);

  const [providers, setProviders] = useState({ telegram: false, discord: false });

  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  const { login } = useAuth();

  const { connect, connecting } = useWallet();



  useEffect(() => {

    const urlError = searchParams.get("error");

    if (urlError) setError(decodeURIComponent(urlError));

  }, [searchParams]);



  useEffect(() => {

    fetch(`${API_BASE_URL}/api/health`)

      .then((r) => r.json())

      .then((d) => setSandboxMode(Boolean(d.sandboxAllowed)))

      .catch(() => setSandboxMode(false));



    ApiClient.get("/api/auth/providers")

      .then(setProviders)

      .catch(() => {});

  }, []);



  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");

    try {

      const json = await ApiClient.post("/api/auth/login", credential);

      login(json.authToken, json.user);

      navigate("/");

    } catch (err) {

      setError(err.message || "Invalid email or password");

    }

  };



  const handleWalletLogin = async (type) => {

    setError("");

    try {

      await connect(type);

      navigate("/");

    } catch (err) {

      setError(err.message);

    }

  };



  const handleTelegramLogin = async (telegramUser) => {

    setError("");

    try {

      const json = await ApiClient.post("/api/auth/telegram-login", telegramUser);

      login(json.authToken, json.user);

      navigate("/");

    } catch (err) {

      setError(err.message || "Telegram login failed");

    }

  };



  const handleDiscordLogin = async () => {

    setError("");

    try {

      const { url } = await ApiClient.get("/api/auth/discord/start");

      window.location.href = url;

    } catch (err) {

      setError(err.message || "Discord login unavailable");

    }

  };



  const getValue = (v) => {

    setCredential({ ...credential, [v.target.name]: v.target.value });

  };



  return (

    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">

      <div className="w-full max-w-md">

        <div className="text-center mb-8">

          <Link to="/" className="text-3xl font-bold text-red-500">GoFood</Link>

          <p className="text-slate-400 mt-2">Sign in to your account</p>

        </div>



        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">

          {error && (

            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">

              {error}

            </div>

          )}



          <form onSubmit={handleSubmit} className="space-y-4">

            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Email</p>

            <input

              onChange={getValue}

              type="email"

              className="input-field"

              placeholder="Email"

              name="email"

              value={credential.email}

              required

            />

            <input

              onChange={getValue}

              type="password"

              className="input-field"

              placeholder="Password"

              name="password"

              value={credential.password}

              required

            />

            <button type="submit" className="btn-primary w-full py-3">

              Login with Email

            </button>

          </form>



          <div className="flex items-center gap-3">

            <div className="flex-1 h-px bg-slate-700" />

            <span className="text-xs text-slate-500 uppercase">or</span>

            <div className="flex-1 h-px bg-slate-700" />

          </div>



          <div>

            <p className="text-center text-sm text-slate-400 mb-3">Web3 Wallet</p>

            <div className="flex flex-wrap gap-2 justify-center">

              <button

                type="button"

                className="btn-secondary text-sm"

                disabled={connecting}

                onClick={() => handleWalletLogin("gem")}

              >

                Gem Wallet

              </button>

              <button

                type="button"

                className="btn-secondary text-sm"

                disabled={connecting}

                onClick={() => handleWalletLogin("freighter")}

              >

                Freighter

              </button>

              {sandboxMode && (

                <button

                  type="button"

                  className="btn-secondary text-sm border border-amber-500/50 text-amber-400"

                  disabled={connecting}

                  onClick={() => handleWalletLogin("sandbox")}

                >

                  Sandbox

                </button>

              )}

            </div>

          </div>



          {(providers.telegram || providers.discord) && (

            <>

              <div className="flex items-center gap-3">

                <div className="flex-1 h-px bg-slate-700" />

                <span className="text-xs text-slate-500 uppercase">social</span>

                <div className="flex-1 h-px bg-slate-700" />

              </div>



              {providers.telegram && (

                <TelegramLoginWidget

                  botUsername={providers.telegramBotUsername}

                  loginDomain={providers.telegramLoginDomain}

                  onAuth={handleTelegramLogin}

                  label="Telegram (link account first in Alerts, or sign in if already linked)"

                />

              )}



              {providers.discord && (

                <button

                  type="button"

                  onClick={handleDiscordLogin}

                  className="w-full py-3 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"

                >

                  Login with Discord

                </button>

              )}

            </>

          )}



          <p className="text-center text-sm text-slate-400">

            New here?{" "}

            <Link to="/signup" className="text-red-400 hover:text-red-300 font-medium">

              Create an account

            </Link>

          </p>

          <p className="text-center text-xs text-slate-500">

            Wallet-only user? Link Telegram or Discord under Alerts after signing in.

          </p>

        </div>

      </div>

    </div>

  );

};



export default Login;

