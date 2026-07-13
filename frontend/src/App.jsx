import { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";
import fileStorageABI from "./abi/FileStorageNFT.json";

// These are pulled from the .env file
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

export default function App() {
  const [account, setAccount] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Please install MetaMask");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
    } catch (error) {
      console.error("Connection failed", error);
    }
  }

  const getContract = (signerOrProvider) => {
    return new ethers.Contract(CONTRACT_ADDRESS, fileStorageABI.abi, signerOrProvider);
  };

  async function loadFiles() {
    if (!window.ethereum || !account || !CONTRACT_ADDRESS) return;
    setLoading(true);
    setStatus("Reading Blockchain Database...");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Check we are on Sepolia (chainId 11155111)
      const network = await provider.getNetwork();
      if (network.chainId !== 11155111n) {
        setStatus("Wrong Network! Please switch MetaMask to Sepolia (chain " + network.chainId.toString() + " detected)");
        setLoading(false);
        return;
      }

      const contract = getContract(provider);
      const count = await contract.tokenCounter();
      const fetchedFiles = [];
      
      // We loop through the blockchain mapping (our database)
      for (let i = 0; i < Number(count); i++) {
        try {
          const file = await contract.getFile(i);
          fetchedFiles.push({
            id: i,
            cid: file.cid,
            fileName: file.fileName,
            uploader: file.uploader,
            timestamp: new Date(Number(file.timestamp) * 1000).toLocaleString()
          });
        } catch (err) {
          console.error("Error fetching file " + i + ":", err);
        }
      }
      setFiles(fetchedFiles.reverse());
      setStatus("");
    } catch (error) {
      console.error("Error loading files:", error);
      setStatus("Error: " + (error.reason || error.message || "Check Contract Address"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (account) {
      loadFiles();
    }
  }, [account]);

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount("");
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const uploadToPinata = async () => {
    if (!selectedFile) return null;
    if (PINATA_JWT === "YOUR_PINATA_JWT_HERE" || !PINATA_JWT) {
      alert("Pinata JWT is not configured. Please check VITE_PINATA_JWT in your frontend/.env file and restart your Vite server.");
      return null;
    }

    setStatus("Uploading to IPFS Storage...");
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: "Bearer " + PINATA_JWT,
        },
      });

      return res.data.IpfsHash;
    } catch (error) {
      console.error("Pinata error:", error);
      setStatus("IPFS Upload Failed");
      alert("IPFS Upload Failed: " + (error.response?.data?.error || error.message) + ". Make sure you restarted the Vite server after configuring your .env file.");
      return null;
    }
  };

  async function handleForge() {
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }
    if (!CONTRACT_ADDRESS) {
      alert("Contract address is not configured. Please check VITE_CONTRACT_ADDRESS in your frontend/.env file and restart your Vite server.");
      return;
    }

    // 1. Upload to IPFS
    const cid = await uploadToPinata();
    if (!cid) return;

    // 2. Write to Blockchain Database (Mint NFT)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getContract(signer);
      
      setStatus("Confirm Minting in MetaMask...");
      const tx = await contract.uploadFile(cid, fileName);
      
      setStatus("Recording on Blockchain...");
      await tx.wait();
      
      setStatus("Forge Success!");
      alert("Success! File stored in decentralized vault.");
      
      setFileName("");
      setSelectedFile(null);
      loadFiles();
    } catch (error) {
      console.error(error);
      setStatus("Minting Failed");
      alert("Minting failed: " + (error.reason || error.message));
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-900 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
              STORAGE FORGE
            </h1>
            <p className="text-slate-500 text-xs mt-1 font-medium tracking-widest uppercase">ERC-721 Metadata Vault</p>
          </div>
          {!account ? (
            <button
              onClick={connectWallet}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/40"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="text-right">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Connected Wallet</p>
              <p className="text-cyan-400 font-mono text-sm font-bold">{account.slice(0, 6)}...{account.slice(-4)}</p>
            </div>
          )}
        </div>

        {account && (
          <>
            {/* Main Action Card */}
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-700 space-y-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
              
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Forge New Asset</h2>
                {status && (
                  <span className="bg-blue-500/10 text-blue-400 text-xs font-bold px-3 py-1 rounded-full animate-pulse border border-blue-500/30">
                    {status}
                  </span>
                )}
              </div>

              <div className="space-y-6">
                <div className="relative group">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full h-48 bg-slate-800/50 border-2 border-dashed border-slate-700 group-hover:border-blue-500/50 group-hover:bg-slate-800 rounded-2xl flex flex-col items-center justify-center transition-all text-center">
                    <span className="text-5xl mb-3">{selectedFile ? "📄" : "📁"}</span>
                    <p className="text-slate-300 font-bold px-4 truncate w-full">
                      {selectedFile ? selectedFile.name : "Click to select any file"}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      {selectedFile ? (selectedFile.size / 1024).toFixed(2) + " KB" : "IPFS + ERC-721"}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Optional: Customize Name</label>
                  <input
                    placeholder="Document Name"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3.5 focus:outline-none focus:border-blue-500 transition-all text-sm font-medium"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                  />
                </div>

                <button 
                  onClick={handleForge} 
                  disabled={!selectedFile}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-800 disabled:text-slate-600 p-4 rounded-xl font-black text-lg transition-all active:scale-[0.98] shadow-xl shadow-blue-900/20 uppercase tracking-widest"
                >
                  Confirm & Forge to Blockchain
                </button>
              </div>
            </div>

            {/* Vault List */}
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-700 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <span className="w-2 h-8 bg-cyan-500 rounded-full"></span>
                  Vault Contents
                </h2>
                <button 
                  onClick={loadFiles} 
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold transition-all border border-slate-700"
                >
                  REFRESH
                </button>
              </div>
              
              {loading ? (
                <div className="text-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                  <p className="text-slate-500 font-medium tracking-widest text-xs uppercase">Reading Distributed Ledger...</p>
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-20 bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-800">
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No assets found on this contract.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {files.map((file) => (
                    <div key={file.id} className="group bg-slate-800/30 hover:bg-slate-800/60 p-6 rounded-2xl border border-slate-800 hover:border-slate-600 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded font-mono font-bold">ID #{file.id}</span>
                          <h3 className="text-lg font-bold text-white">{file.fileName}</h3>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono break-all leading-tight">
                          CID: <span className="text-cyan-500/60">{file.cid}</span>
                        </p>
                      </div>
                      <div className="flex gap-3 w-full md:w-auto">
                        <a
                          href={"https://gateway.pinata.cloud/ipfs/" + file.cid}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 md:flex-none text-center bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-white border border-cyan-500/50 px-6 py-2 rounded-xl text-xs font-bold transition-all"
                        >
                          OPEN IPFS
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
