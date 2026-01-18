"use client"

import { useState, useEffect, useRef, useCallback } from "react"

const PRODUCT_LIST = [
  // 🍺 Cervejas – Garrafa / Lata
  "Heineken Ret 24/600ml",
  "Amstel Ret 24/600ml",
  "Glacial Ret 24/600ml",
  "Eisen Pilsen 600ml Ret 24",
  "Kaiser Lager 600ml Ret 24",
  "Eisen Unfiltered 600ml GFA",
  "Amstel Lager 355ml LN 2x6",
  "Eisen Pilsen 355ml LN 2/6",
  "Eisen Weiss 355ml LN",
  "Eisen Pale Ale 355ml LN",
  "Eisen Unfiltered 355ml LN",
  "Eisen Session IPA 355ml LN",
  "Eisen IPA 355ml LN",
  "Eisen Praia Lager 355ml",
  "Amstel Ret 12/1000ml",
  "Glacial Ret 12/1000ml",
  "Praia Original 600ml 12un",
  "Heineken Desc 12/600ml",
  // 🍺 Long Neck / Sleek / Lata
  "Amstel Lager 350ml Sleek 12un",
  "Praia Original 269ml 12un",
  "Heineken Pilsen 269ml LT Desc",
  "Heineken Pilsen 350ml Sleek",
  "Heineken 0.0 350ml Sleek",
  "Eisen Pilsen 350ml Sleek",
  "Eisen IPA 350ml Sleek",
  "Eisen Unfiltered 350ml Sleek",
  "Eisen Session IPA 350ml Sleek",
  "Eisen Pale Ale 350ml Sleek",
  "Kaiser Lager 350ml LT",
  "Bavaria 350ml LT",
  "Heineken 250ml",
  // 🍺 473ml
  "Heineken 12/473ml",
  "Amstel 12/473ml",
  "Glacial 12/473ml",
  "Kaiser Lager 473ml",
  "Eisen Pilsen 473ml",
  "Bavaria Pilsen 473ml",
  "Tiger Crystal 473ml",
  // 🍺 330ml
  "Heineken 330gfa RT 24un",
  "Heineken 24/330ml",
  "Heineken 0.0 24/330ml",
  "Praia Clássica 355ml LN 4x6",
  "Sol Pilsen 330 Desc Astro",
  "Sol Pilsen 330 Desc Astro Zero",
  "Praia Lager 330 4x6",
  // 🧃 FYS
  "Fys Tônica 350ml",
  "Fys Tônica Zero 350ml",
  "Fys Guaraná 350ml",
  "Fys Guaraná Zero 350ml",
  "Fys Laranja 350ml",
  "Fys Limão 350ml",
  "Fys Limão Zero 350ml",
  // 🧃 Itubaína
  "Itubaína Original 355ml",
  "Itubaína Original Zero 355ml",
  // ☕ Chás
  "Chá Baer Mate 269ml",
  "Chá Baer Mate 350ml",
  "Chá Baer Matha 350ml",
]

const CATEGORIES = [
  { id: "entrega", label: "📦 Perda na Entrega", emoji: "📦" },
  { id: "armazem", label: "🏭 Perda no Armazém", emoji: "🏭" },
  { id: "pdv", label: "🛒 Troca no PDV", emoji: "🛒" },
  { id: "vencimento", label: "⏰ Vencimento", emoji: "⏰" },
]

// Mapa de abreviações para produtos
const ABBREVIATIONS: Record<string, string[]> = {
  "hnk": ["Heineken Ret 24/600ml", "Heineken Pilsen 269ml LT Desc", "Heineken Pilsen 350ml Sleek", "Heineken 0.0 350ml Sleek", "Heineken 12/473ml", "Heineken 330gfa RT 24un", "Heineken 24/330ml", "Heineken 0.0 24/330ml", "Heineken Desc 12/600ml", "Heineken 250ml"],
  "amst": ["Amstel Ret 24/600ml", "Amstel Lager 355ml LN 2x6", "Amstel Lager 350ml Sleek 12un", "Amstel Ret 12/1000ml", "Amstel 12/473ml"],
  "glc": ["Glacial Ret 24/600ml", "Glacial Ret 12/1000ml", "Glacial 12/473ml"],
  "eisen": ["Eisen Pilsen 600ml Ret 24", "Eisen Unfiltered 600ml GFA", "Eisen Pilsen 355ml LN 2/6", "Eisen Weiss 355ml LN", "Eisen Pale Ale 355ml LN", "Eisen Unfiltered 355ml LN", "Eisen Session IPA 355ml LN", "Eisen IPA 355ml LN", "Eisen Praia Lager 355ml", "Eisen Pilsen 350ml Sleek", "Eisen IPA 350ml Sleek", "Eisen Unfiltered 350ml Sleek", "Eisen Session IPA 350ml Sleek", "Eisen Pale Ale 350ml Sleek", "Eisen Pilsen 473ml"],
  "kaiser": ["Kaiser Lager 600ml Ret 24", "Kaiser Lager 350ml LT", "Kaiser Lager 473ml"],
  "praia": ["Praia Original 600ml 12un", "Praia Original 269ml 12un", "Praia Lager 330 4x6", "Eisen Praia Lager 355ml"],
  "sol": ["Sol Pilsen 330 Desc Astro", "Sol Pilsen 330 Desc Astro Zero"],
  "fys": ["Fys Tônica 350ml", "Fys Tônica Zero 350ml", "Fys Guaraná 350ml", "Fys Guaraná Zero 350ml", "Fys Laranja 350ml", "Fys Limão 350ml", "Fys Limão Zero 350ml"],
  "itubaína": ["Itubaína Original 355ml", "Itubaína Original Zero 355ml"],
  "chá": ["Chá Baer Mate 269ml", "Chá Baer Mate 350ml", "Chá Baer Matha 350ml"],
  "bavaria": ["Bavaria 350ml LT", "Bavaria Pilsen 473ml"],
  "tiger": ["Tiger Crystal 473ml"],
}

interface Item {
  id: string
  name: string
  quantity: number
}

interface Occurrence {
  id: string
  category: string
  photo: string
  items: Item[]
  observation: string
  date: string
  status: "sent" | "pending" | "error"
  timestamp: number
}

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState("register") // register, history, settings
  const [selectedCategory, setSelectedCategory] = useState("")
  const [photoPreview, setPhotoPreview] = useState("")
  const [photoFile, setPhotoFile] = useState<Blob | null>(null)
  const [productInput, setProductInput] = useState("")
  const [quantityInput, setQuantityInput] = useState("1")
  const [items, setItems] = useState<Item[]>([])
  const [observation, setObservation] = useState("")
  const [occurrences, setOccurrences] = useState<Occurrence[]>([])
  const [filteredProducts, setFilteredProducts] = useState<string[]>([])
  const [connectionStatus, setConnectionStatus] = useState("online")
  const [botToken, setBotToken] = useState("")
  const [chatId, setChatId] = useState("")
  const [operatorName, setOperatorName] = useState("")
  const [autoSend, setAutoSend] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingQuantity, setEditingQuantity] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Load data from localStorage e .env.local
  useEffect(() => {
    // Primeiro, tenta carregar do .env.local (variáveis de ambiente)
    const envBot = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_TELEGRAM_BOT : undefined
    const envChat = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_TELEGRAM_CHAT : undefined
    const envOperator = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_OPERATOR_NAME : undefined

    // Depois, tenta carregar do localStorage
    const savedBot = localStorage.getItem("telegram_bot")
    const savedChat = localStorage.getItem("telegram_chat")
    const savedOperator = localStorage.getItem("operator_name")
    const savedAutoSend = localStorage.getItem("auto_send")
    const savedOccurrences = localStorage.getItem("occurrences")

    // Usa a ordem: .env.local > localStorage > vazio
    if (envBot) setBotToken(envBot)
    else if (savedBot) setBotToken(savedBot)
    
    if (envChat) setChatId(envChat)
    else if (savedChat) setChatId(savedChat)
    
    if (envOperator) setOperatorName(envOperator)
    else if (savedOperator) setOperatorName(savedOperator)
    
    if (savedAutoSend) setAutoSend(JSON.parse(savedAutoSend))
    if (savedOccurrences) setOccurrences(JSON.parse(savedOccurrences))
  }, [])

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => setConnectionStatus("online")
    const handleOffline = () => setConnectionStatus("offline")

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleProductInput = (value: string) => {
    setProductInput(value)
    if (value.trim()) {
      const searchTerm = value.toLowerCase().trim()
      
      // Primeiro, verificar se é uma abreviação
      let filtered: string[] = []
      
      if (searchTerm in ABBREVIATIONS) {
        filtered = ABBREVIATIONS[searchTerm as keyof typeof ABBREVIATIONS]
      } else {
        // Se não for abreviação exata, buscar por nome completo
        filtered = PRODUCT_LIST.filter((product) => 
          product.toLowerCase().includes(searchTerm)
        )
      }
      
      setFilteredProducts(filtered.slice(0, 8))
    } else {
      setFilteredProducts([])
    }
  }

  const addItem = () => {
    if (!productInput.trim() || !quantityInput) {
      alert("Preencha produto e quantidade")
      return
    }

    const newItem: Item = {
      id: Date.now().toString(),
      name: productInput,
      quantity: Number.parseInt(quantityInput),
    }

    setItems([...items, newItem])
    setProductInput("")
    setQuantityInput("1")
    setFilteredProducts([])
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const startEditingItem = (item: Item) => {
    setEditingItemId(item.id)
    setEditingQuantity(item.quantity.toString())
  }

  const saveEditItem = (id: string) => {
    const newQuantity = Number.parseInt(editingQuantity)
    if (!newQuantity || newQuantity < 1) {
      alert("Quantidade deve ser maior que 0")
      return
    }

    setItems(items.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)))
    setEditingItemId(null)
    setEditingQuantity("")
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      alert("Erro ao acessar câmera: " + (error instanceof Error ? error.message : String(error)))
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    const cameraView = document.getElementById("camera-view")
    if (cameraView) {
      cameraView.style.display = "none"
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const context = canvasRef.current.getContext("2d")
    if (!context) return

    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    context.drawImage(videoRef.current, 0, 0)

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        setPhotoFile(blob)
        setPhotoPreview(canvasRef.current!.toDataURL("image/jpeg"))
        stopCamera()
      }
    }, "image/jpeg", 0.9)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const sendToTelegram = async () => {
    if (!botToken || !chatId) {
      alert("Configure o Token do Bot e Chat ID nas Configurações")
      return
    }

    if (!selectedCategory || !items.length || !photoFile) {
      alert("Preencha categoria, adicione itens e tire uma foto")
      return
    }

    setIsSending(true)

    const categoryLabel = CATEGORIES.find((c) => c.id === selectedCategory)?.label || selectedCategory
    const timestamp = new Date()
    const dateStr = timestamp.toLocaleString("pt-BR")

    let messageText = `📂 Categoria: ${categoryLabel}\n`
    messageText += `📅 Data: ${dateStr}\n`
    if (observation) {
      messageText += `📝 Observação: ${observation}\n`
    }
    messageText += `👤 Operador: ${operatorName || "Não informado"}\n\n`
    messageText += `🧾 Itens:\n`
    items.forEach((item, index) => {
      messageText += `${index + 1}) ${item.name} — ${item.quantity} un\n`
    })

    const occurrence: Occurrence = {
      id: Date.now().toString(),
      category: selectedCategory,
      photo: photoPreview,
      items: items,
      observation: observation,
      date: dateStr,
      status: "pending",
      timestamp: timestamp.getTime(),
    }

    try {
      const formData = new FormData()
      formData.append("chat_id", chatId)
      formData.append("caption", messageText)
      formData.append("photo", photoFile, "evidencia.jpg")

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.ok) {
        occurrence.status = "sent"
        alert("✅ Enviado com sucesso!")
      } else {
        throw new Error(data.description || "Erro ao enviar")
      }
    } catch (error) {
      console.error("Erro ao enviar:", error)
      if (connectionStatus === "offline") {
        occurrence.status = "pending"
        alert("📤 Sem conexão. Será enviado quando reconectar.")
      } else {
        occurrence.status = "error"
        alert("❌ Erro ao enviar: " + (error instanceof Error ? error.message : String(error)))
      }
    }

    const updatedOccurrences = [occurrence, ...occurrences]
    setOccurrences(updatedOccurrences)
    localStorage.setItem("occurrences", JSON.stringify(updatedOccurrences))

    // Reset form
    setSelectedCategory("")
    setItems([])
    setObservation("")
    setPhotoPreview("")
    setPhotoFile(null)
    setIsSending(false)
  }

  const resendOccurrence = async (occurrence: Occurrence) => {
    if (!botToken || !chatId) {
      alert("Configure o Token do Bot e Chat ID nas Configurações")
      return
    }

    if (!occurrence.photo) {
      alert("Foto não disponível")
      return
    }

    setIsSending(true)

    const categoryLabel = CATEGORIES.find((c) => c.id === occurrence.category)?.label || occurrence.category

    let messageText = `📂 Categoria: ${categoryLabel}\n`
    messageText += `📅 Data: ${occurrence.date}\n`
    if (occurrence.observation) {
      messageText += `📝 Observação: ${occurrence.observation}\n`
    }
    messageText += `👤 Operador: ${operatorName || "Não informado"}\n\n`
    messageText += `🧾 Itens:\n`
    occurrence.items.forEach((item, index) => {
      messageText += `${index + 1}) ${item.name} — ${item.quantity} un\n`
    })

    try {
      const formData = new FormData()
      formData.append("chat_id", chatId)
      formData.append("caption", messageText)
      
      // Convert base64 photo to blob
      const response = await fetch(occurrence.photo)
      const blob = await response.blob()
      formData.append("photo", blob, "evidencia.jpg")

      const sendResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: "POST",
        body: formData,
      })

      const data = await sendResponse.json()

      if (data.ok) {
        const updated = occurrences.map((occ) => (occ.id === occurrence.id ? { ...occ, status: "sent" } : occ))
        setOccurrences(updated)
        localStorage.setItem("occurrences", JSON.stringify(updated))
        alert("✅ Reenviado com sucesso!")
      } else {
        throw new Error(data.description || "Erro ao enviar")
      }
    } catch (error) {
      console.error("Erro ao reenviar:", error)
      if (connectionStatus === "offline") {
        alert("📤 Sem conexão. Tente novamente quando online.")
      } else {
        alert("❌ Erro ao reenviar: " + (error instanceof Error ? error.message : String(error)))
      }
    }

    setIsSending(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "#28a745"
      case "pending":
        return "#ffc107"
      case "error":
        return "#dc3545"
      default:
        return "#6c757d"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "sent":
        return "✅ Enviado"
      case "pending":
        return "📤 Pendente"
      case "error":
        return "❌ Erro"
      default:
        return "⚪ Desconhecido"
    }
  }

  const exportToCSV = () => {
    if (occurrences.length === 0) {
      alert("Nenhuma ocorrência para exportar")
      return
    }

    let csvContent = "Categoria,Data,Status,Itens,Observação\n"

    occurrences.forEach((occ) => {
      const categoryLabel = CATEGORIES.find((c) => c.id === occ.category)?.label || occ.category
      const itemsText = occ.items.map((item) => `${item.name} (${item.quantity}un)`).join(" | ")
      csvContent += `"${categoryLabel}","${occ.date}","${occ.status}","${itemsText}","${occ.observation}"\n`
    })

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `historico_perdas_${new Date().toISOString().split("T")[0]}.csv`)
    link.click()
  }

  // TELA 1: Registrar Perda
  if (currentScreen === "register") {
    return (
      <div className="marca-foto-container">
        <div className="container">
          <header>
            <h1>📦 Registrar Perda</h1>
            <p style={{ fontSize: "14px", color: "#666", marginTop: "5px" }}>
              {connectionStatus === "online" ? "🟢 Online" : "🔴 Offline"}
            </p>
          </header>

          {/* Seleção de Categoria */}
          <div style={{ marginBottom: "20px" }}>
            <label>Selecione a Categoria:</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginTop: "10px",
              }}
            >
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    background: selectedCategory === cat.id ? "#1a2a6c" : "#e9ecef",
                    color: selectedCategory === cat.id ? "white" : "#333",
                    border: "none",
                    padding: "15px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    marginTop: 0,
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Câmera */}
          <div style={{ marginBottom: "20px", padding: "15px", background: "rgba(26, 42, 108, 0.05)", borderRadius: "10px" }}>
            <label>📷 Evidência Fotográfica:</label>

            {!photoPreview ? (
              <>
                <button
                  onClick={() => {
                    const cameraView = document.getElementById("camera-view")
                    if (cameraView) {
                      cameraView.style.display = "flex"
                      startCamera()
                    }
                  }}
                  style={{
                    background: "linear-gradient(to right, #1a2a6c, #b21f1f)",
                    marginTop: "10px",
                  }}
                >
                  📷 Abrir Câmera
                </button>

                <div style={{ textAlign: "center", margin: "15px 0", color: "#666" }}>
                  <strong>OU</strong>
                </div>

                <label className="file-upload">
                  <input type="file" accept="image/*" onChange={handleFileUpload} hidden />
                  📁 Selecionar do Galeria
                </label>
              </>
            ) : (
              <>
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={{
                    width: "100%",
                    borderRadius: "10px",
                    marginTop: "10px",
                    border: "2px solid #1a2a6c",
                  }}
                />
                <button
                  onClick={() => {
                    setPhotoPreview("")
                    setPhotoFile(null)
                  }}
                  style={{ background: "#dc3545", marginTop: "10px" }}
                >
                  ❌ Remover Foto
                </button>
              </>
            )}

            <div id="camera-view" style={{ display: "none", marginTop: "15px", flexDirection: "column" }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  width: "100%",
                  border: "2px solid #1a2a6c",
                  borderRadius: "8px",
                  marginBottom: "10px",
                }}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={capturePhoto} style={{ flex: 1, background: "#28a745", marginTop: "0" }}>
                  📸 Capturar
                </button>
                <button
                  onClick={stopCamera}
                  style={{ flex: 1, background: "#dc3545", marginTop: "0" }}
                >
                  ❌ Fechar
                </button>
              </div>
            </div>
          </div>

          <canvas ref={canvasRef} style={{ display: "none" }} />

          {/* Adicionar Itens */}
          <div style={{ marginBottom: "20px", padding: "15px", background: "rgba(26, 42, 108, 0.05)", borderRadius: "10px" }}>
            <label>🧾 Adicionar Itens:</label>

            <div style={{ position: "relative", marginTop: "10px" }}>
              <input
                type="text"
                placeholder="Digite o nome do produto..."
                value={productInput}
                onChange={(e) => handleProductInput(e.target.value)}
                style={{ marginBottom: "0" }}
              />

              {filteredProducts.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: "0",
                    right: "0",
                    background: "white",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    maxHeight: "200px",
                    overflowY: "auto",
                    zIndex: 10,
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                >
                  {filteredProducts.map((product) => (
                    <div
                      key={product}
                      onClick={() => {
                        setProductInput(product)
                        setFilteredProducts([])
                      }}
                      style={{
                        padding: "10px 15px",
                        borderBottom: "1px solid #eee",
                        cursor: "pointer",
                        transition: "background 0.2s",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "#f0f0f0"
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "white"
                      }}
                    >
                      {product}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label style={{ marginTop: "15px" }}>Quantidade:</label>
            <input
              type="number"
              min="1"
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              style={{ marginBottom: "10px" }}
            />

            <button onClick={addItem} style={{ background: "#28a745", marginTop: "10px" }}>
              ➕ Adicionar Item
            </button>
          </div>

          {/* Lista de Itens */}
          {items.length > 0 && (
            <div style={{ marginBottom: "20px", padding: "15px", background: "rgba(42, 108, 26, 0.05)", borderRadius: "10px" }}>
              <h3 style={{ color: "#1a2a6c", marginBottom: "15px" }}>📋 Itens Adicionados ({items.length}):</h3>

              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: "white",
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: "1px solid #e9ecef",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <strong>{item.name}</strong>
                    {editingItemId === item.id ? (
                      <div style={{ marginTop: "8px", display: "flex", gap: "5px", alignItems: "center" }}>
                        <input
                          type="number"
                          min="1"
                          value={editingQuantity}
                          onChange={(e) => setEditingQuantity(e.target.value)}
                          style={{ width: "60px", marginTop: "0" }}
                        />
                        <button
                          onClick={() => saveEditItem(item.id)}
                          style={{ background: "#28a745", padding: "5px 10px", fontSize: "12px", marginTop: "0" }}
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setEditingItemId(null)}
                          style={{ background: "#dc3545", padding: "5px 10px", fontSize: "12px", marginTop: "0" }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>Quantidade: {item.quantity} un</p>
                    )}
                  </div>

                  {editingItemId !== item.id && (
                    <div style={{ display: "flex", gap: "5px" }}>
                      <button
                        onClick={() => startEditingItem(item)}
                        style={{
                          background: "#ffc107",
                          padding: "5px 10px",
                          fontSize: "12px",
                          marginTop: "0",
                          minWidth: "auto",
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        style={{
                          background: "#dc3545",
                          padding: "5px 10px",
                          fontSize: "12px",
                          marginTop: "0",
                          minWidth: "auto",
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Observação */}
          <label>📝 Observação (opcional):</label>
          <textarea
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="Ex: Queda de pallet, dano em transporte..."
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              marginTop: "5px",
              minHeight: "80px",
              fontFamily: "inherit",
              marginBottom: "20px",
              boxSizing: "border-box",
            }}
          />

          {/* Botão Enviar */}
          <button
            onClick={sendToTelegram}
            disabled={isSending || !selectedCategory || !items.length || !photoPreview}
            style={{
              background: isSending ? "#6c757d" : "linear-gradient(to right, #1a2a6c, #b21f1f)",
              width: "100%",
              padding: "15px",
              fontSize: "16px",
              fontWeight: "bold",
              marginBottom: "20px",
              marginTop: "0",
              opacity: isSending || !selectedCategory || !items.length || !photoPreview ? 0.6 : 1,
            }}
          >
            {isSending ? "⏳ Enviando..." : "🚀 Enviar tudo para o Telegram"}
          </button>

          {/* Navigation */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setCurrentScreen("history")}
              style={{
                flex: 1,
                background: "#17a2b8",
                marginTop: "0",
              }}
            >
              📜 Histórico
            </button>
            <button
              onClick={() => setCurrentScreen("settings")}
              style={{
                flex: 1,
                background: "#6c757d",
                marginTop: "0",
              }}
            >
              ⚙️ Configurações
            </button>
          </div>
        </div>
      </div>
    )
  }

  // TELA 2: Histórico
  if (currentScreen === "history") {
    const [filterCategory, setFilterCategory] = useState("")
    const [filterStatus, setFilterStatus] = useState("")
    const [selectedOccurrence, setSelectedOccurrence] = useState<Occurrence | null>(null)

    const filteredOccurrences = occurrences.filter((occ) => {
      if (filterCategory && occ.category !== filterCategory) return false
      if (filterStatus && occ.status !== filterStatus) return false
      return true
    })

    if (selectedOccurrence) {
      return (
        <div className="marca-foto-container">
          <div className="container">
            <header>
              <h1>📋 Detalhes da Ocorrência</h1>
            </header>

            <button
              onClick={() => setSelectedOccurrence(null)}
              style={{
                background: "#6c757d",
                marginBottom: "15px",
              }}
            >
              ← Voltar
            </button>

            <div style={{ padding: "15px", background: "rgba(26, 42, 108, 0.05)", borderRadius: "10px", marginBottom: "15px" }}>
              <h3 style={{ color: "#1a2a6c", marginBottom: "10px" }}>
                {CATEGORIES.find((c) => c.id === selectedOccurrence.category)?.label}
              </h3>
              <p>
                <strong>Data:</strong> {selectedOccurrence.date}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  style={{
                    background: getStatusColor(selectedOccurrence.status),
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    display: "inline-block",
                  }}
                >
                  {getStatusText(selectedOccurrence.status)}
                </span>
              </p>
            </div>

            {selectedOccurrence.photo && (
              <div style={{ marginBottom: "15px" }}>
                <label>Foto:</label>
                <img
                  src={selectedOccurrence.photo}
                  alt="Evidência"
                  style={{
                    width: "100%",
                    borderRadius: "10px",
                    border: "2px solid #1a2a6c",
                    marginTop: "10px",
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: "15px" }}>
              <label>Itens:</label>
              <div style={{ background: "rgba(248, 249, 250, 0.95)", padding: "15px", borderRadius: "10px", marginTop: "10px" }}>
                {selectedOccurrence.items.map((item, index) => (
                  <p key={item.id} style={{ margin: "8px 0" }}>
                    <strong>{index + 1})</strong> {item.name} — {item.quantity} un
                  </p>
                ))}
              </div>
            </div>

            {selectedOccurrence.observation && (
              <div style={{ marginBottom: "15px" }}>
                <label>Observação:</label>
                <div
                  style={{
                    background: "rgba(248, 249, 250, 0.95)",
                    padding: "15px",
                    borderRadius: "10px",
                    marginTop: "10px",
                  }}
                >
                  {selectedOccurrence.observation}
                </div>
              </div>
            )}

            {selectedOccurrence.status !== "sent" && (
              <button
                onClick={() => resendOccurrence(selectedOccurrence)}
                disabled={isSending}
                style={{
                  background: "#007bff",
                  marginBottom: "15px",
                }}
              >
                {isSending ? "⏳ Enviando..." : "🔄 Reenviar"}
              </button>
            )}

            <button
              onClick={() => setSelectedOccurrence(null)}
              style={{
                background: "#6c757d",
              }}
            >
              ← Voltar
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="marca-foto-container">
        <div className="container">
          <header>
            <h1>📜 Histórico de Perdas</h1>
          </header>

          {/* Filtros */}
          <div style={{ marginBottom: "20px", padding: "15px", background: "rgba(26, 42, 108, 0.05)", borderRadius: "10px" }}>
            <label>Filtrar por Categoria:</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ marginBottom: "15px" }}
            >
              <option value="">Todas as categorias</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>

            <label>Filtrar por Status:</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">Todos os status</option>
              <option value="sent">✅ Enviado</option>
              <option value="pending">📤 Pendente</option>
              <option value="error">❌ Erro</option>
            </select>
          </div>

          {/* Lista */}
          {filteredOccurrences.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
              <p style={{ fontSize: "18px" }}>Nenhuma ocorrência encontrada</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "15px", marginBottom: "20px" }}>
              {filteredOccurrences.map((occ) => (
                <div
                  key={occ.id}
                  onClick={() => setSelectedOccurrence(occ)}
                  style={{
                    background: "white",
                    padding: "15px",
                    borderRadius: "10px",
                    border: "2px solid #e9ecef",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    borderLeft: `4px solid ${getStatusColor(occ.status)}`,
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = "none"
                  }}
                >
                  <div style={{ display: "flex", gap: "15px" }}>
                    {occ.photo && (
                      <img
                        src={occ.photo}
                        alt="Miniatura"
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                      />
                    )}

                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: "0 0 8px 0", color: "#1a2a6c" }}>
                        {CATEGORIES.find((c) => c.id === occ.category)?.label}
                      </h4>
                      <p style={{ margin: "4px 0", fontSize: "14px" }}>
                        <strong>Data:</strong> {occ.date}
                      </p>
                      <p style={{ margin: "4px 0", fontSize: "14px" }}>
                        <strong>Itens:</strong> {occ.items.length}
                      </p>
                      <span
                        style={{
                          background: getStatusColor(occ.status),
                          color: "white",
                          padding: "4px 12px",
                          borderRadius: "20px",
                          display: "inline-block",
                          fontSize: "12px",
                          marginTop: "8px",
                        }}
                      >
                        {getStatusText(occ.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setCurrentScreen("register")}
              style={{
                flex: 1,
                background: "#1a2a6c",
                marginTop: "0",
              }}
            >
              📦 Registrar
            </button>
            <button
              onClick={() => setCurrentScreen("settings")}
              style={{
                flex: 1,
                background: "#6c757d",
                marginTop: "0",
              }}
            >
              ⚙️ Configurações
            </button>
          </div>
        </div>
      </div>
    )
  }

  // TELA 3: Configurações
  if (currentScreen === "settings") {
    return (
      <div className="marca-foto-container">
        <div className="container">
          <header>
            <h1>⚙️ Configurações</h1>
          </header>

          <div style={{ marginBottom: "20px", padding: "15px", background: "rgba(26, 42, 108, 0.05)", borderRadius: "10px" }}>
            <label>Token do Bot Telegram:</label>
            <input
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="Copie do BotFather"
              style={{ marginBottom: "15px" }}
            />

            <label>Chat ID do Telegram:</label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="ID do grupo ou chat privado"
              style={{ marginBottom: "15px" }}
            />

            <label>Nome do Operador:</label>
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              placeholder="Seu nome ou matrícula"
              style={{ marginBottom: "15px" }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "15px",
                padding: "10px",
                background: "white",
                borderRadius: "8px",
              }}
            >
              <input
                type="checkbox"
                checked={autoSend}
                onChange={(e) => setAutoSend(e.target.checked)}
                style={{ width: "auto", margin: "0", cursor: "pointer" }}
              />
              <label style={{ margin: "0", fontWeight: "normal" }}>
                ✓ Enviar automaticamente após adicionar items
              </label>
            </div>

            <button
              onClick={() => {
                localStorage.setItem("telegram_bot", botToken)
                localStorage.setItem("telegram_chat", chatId)
                localStorage.setItem("operator_name", operatorName)
                localStorage.setItem("auto_send", JSON.stringify(autoSend))
                alert("✅ Configurações salvas!")
              }}
              style={{
                background: "#28a745",
                marginBottom: "15px",
              }}
            >
              💾 Salvar Configurações
            </button>
          </div>

          {/* Exportar e Apagar */}
          <div style={{ marginBottom: "20px", padding: "15px", background: "rgba(220, 53, 69, 0.05)", borderRadius: "10px" }}>
            <h3 style={{ color: "#1a2a6c", marginBottom: "15px" }}>Dados</h3>

            <button
              onClick={exportToCSV}
              style={{
                background: "#17a2b8",
                marginBottom: "10px",
              }}
            >
              📊 Exportar Histórico (CSV)
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                background: "#dc3545",
              }}
            >
              🗑️ Apagar Todo o Histórico
            </button>
          </div>

          {showDeleteConfirm && (
            <div
              style={{
                position: "fixed",
                top: "0",
                left: "0",
                width: "100%",
                height: "100%",
                background: "rgba(0,0,0,0.7)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  background: "white",
                  padding: "30px",
                  borderRadius: "15px",
                  textAlign: "center",
                  maxWidth: "400px",
                }}
              >
                <h3 style={{ color: "#1a2a6c", marginBottom: "15px" }}>⚠️ Confirmar Exclusão</h3>
                <p style={{ marginBottom: "20px", color: "#666" }}>Tem certeza que deseja apagar todo o histórico? Esta ação não pode ser desfeita.</p>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => {
                      setOccurrences([])
                      localStorage.setItem("occurrences", JSON.stringify([]))
                      setShowDeleteConfirm(false)
                      alert("✅ Histórico apagado!")
                    }}
                    style={{
                      flex: 1,
                      background: "#dc3545",
                      marginTop: "0",
                    }}
                  >
                    Apagar
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{
                      flex: 1,
                      background: "#6c757d",
                      marginTop: "0",
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button
              onClick={() => setCurrentScreen("register")}
              style={{
                flex: 1,
                background: "#1a2a6c",
                marginTop: "0",
              }}
            >
              📦 Registrar
            </button>
            <button
              onClick={() => setCurrentScreen("history")}
              style={{
                flex: 1,
                background: "#17a2b8",
                marginTop: "0",
              }}
            >
              📜 Histórico
            </button>
          </div>
        </div>
      </div>
    )
  }
}
