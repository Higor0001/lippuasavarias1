"use client"

import { useEffect, useRef, useState, useCallback } from "react"

// Helper to cast DOM elements
const getElement = (id: string) => document.getElementById(id) as any

// Extend window type for custom functions
declare global {
  interface Window {
    [key: string]: any
  }
}

export default function Home() {
  const initialized = useRef(false)
  const [showReport, setShowReport] = useState(false)
  const [reportDate, setReportDate] = useState("")
  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState({
    trocaPDV: "",
    vencimento: "",
    perdaArmazen: "",
    perdaEntrega: "",
    observacoes: "",
    caminhao: "",
  })
  const [connectionStatus, setConnectionStatus] = useState("online")
  const [pendingUploads, setPendingUploads] = useState(0)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualData, setManualData] = useState({
    caminhao: "",
    trocaPDV: "0",
    vencimento: "0",
    perdaArmazen: "0",
    perdaEntrega: "0",
    observacoes: "",
  })
  const [showRefugoDialog, setShowRefugoDialog] = useState(false)
  const [currentProcessedPhotos, setCurrentProcessedPhotos] = useState([])
  const [updateInProgress, setUpdateInProgress] = useState(false)
  const [isSendingReport, setIsSendingReport] = useState(false) // Novo estado para o botão de envio de relatório

  // Função de debounce para evitar atualizações excessivas
  const debounce = (func, delay) => {
    let timeoutId
    return function (...args) {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(() => {
        func.apply(this, args)
      }, delay)
    }
  }

  const showStatus = (msg, type) => {
    const statusDisplay = document.getElementById("status")
    if (!statusDisplay) return
    statusDisplay.textContent = msg
    statusDisplay.className = "status"
    if (type) statusDisplay.classList.add(type)

    setTimeout(() => {
      statusDisplay.style.display = "none"
    }, 5000)
  }

  // Função para ajustar a data (movida para o escopo do componente)
  const dataAjustada = useCallback(() => {
    const hoje = new Date()
    const dia = hoje.getDay()
    // Se for segunda-feira (1), ajusta para sexta-feira (dia - 3)
    // Se for domingo (0), ajusta para sábado (dia - 1)
    // Caso contrário, ajusta para o dia anterior (dia - 1)
    if (dia === 1)
      hoje.setDate(hoje.getDate() - 3) // Segunda-feira -> Sexta-feira
    else if (dia === 0)
      hoje.setDate(hoje.getDate() - 1) // Domingo -> Sábado
    else hoje.setDate(hoje.getDate() - 1) // Outros dias -> Dia anterior
    return `${String(hoje.getDate()).padStart(2, "0")}/${String(hoje.getMonth() + 1).padStart(
      2,
      "0",
    )}/${hoje.getFullYear()}`
  }, [])

  // Função para atualizar todas as descrições de imagens com os novos dados manuais
  const updateAllImageDescriptions = (newData) => {
    if (currentProcessedPhotos.length === 0) return

    setUpdateInProgress(true)

    const dados = JSON.parse(localStorage.getItem("bicadaData") || "[]")
    let atualizados = false

    // Atualizar cada item processado com os novos dados
    currentProcessedPhotos.forEach((timestamp) => {
      const index = dados.findIndex((item) => item.timestamp === timestamp)
      if (index !== -1) {
        // Atualizar dados no localStorage
        dados[index] = {
          ...dados[index],
          caminhao: newData.caminhao || dados[index].caminhao,
          trocaPDV: newData.trocaPDV || dados[index].trocaPDV,
          vencimento: newData.vencimento || dados[index].vencimento,
          perdaArmazen: newData.perdaArmazen || dados[index].perdaArmazen,
          perdaEntrega: newData.perdaEntrega || dados[index].perdaEntrega,
          observacoes: newData.observacoes || dados[index].observacoes,
        }

        // Atualizar a interface do usuário
        const itemElement = document.getElementById(`item-${timestamp}`)
        if (itemElement) {
          // Gerar nova descrição
          let novaDescricao = `🚛 CAMINHÃO: ${dados[index].caminhao}\n🔄 TROCA PDV: ${dados[index].trocaPDV}\n`

          if (dados[index].vencimento !== "0")
            novaDescricao += `📅 VENCIMENTO: ${dados[index].vencimento}\n`
          if (dados[index].perdaArmazen !== "0")
            novaDescricao += `📦 PERDA ARMAZEN: ${dados[index].perdaArmazen}\n`
          if (dados[index].perdaEntrega !== "0")
            novaDescricao += `🚚 PERDA ENTREGA: ${dados[index].perdaEntrega}\n`
          if (dados[index].observacoes)
            novaDescricao += `📝 OBS: ${dados[index].observacoes}\n`

          novaDescricao += `📅 DATA: ${dados[index].data}`

          // Atualizar a descrição exibida
          const descricaoDiv = itemElement.querySelector('div[style*="background: rgba(26, 42, 108, 0.1)"]')
          if (descricaoDiv) {
            descricaoDiv.innerHTML = `<strong>Informações que serão enviadas:</strong><br>${novaDescricao.replace(/\n/g, "<br>")}`
          }

          // Atualizar o botão do Telegram com nova descrição
          const telegramBtn = itemElement.querySelector(".telegram-btn") as HTMLElement | null
          if (telegramBtn) {
            const imgElement = getElement(`img-${timestamp}`)
            const dataURL = imgElement?.src || ""
            ;(telegramBtn as any).onclick = new Function(
              `window.enviarParaTelegram('${dataURL}', '${(telegramBtn as any).id}', \`${novaDescricao.replace(/`/g, "\\`")}\`)`,
            )
          }
        }

        atualizados = true
      }
    })

    if (atualizados) {
      localStorage.setItem("bicadaData", JSON.stringify(dados))
      showStatus("Todas as descrições foram atualizadas!", "success")
    }

    setUpdateInProgress(false)
  }

  // Versão com debounce da função de atualização
  const debouncedUpdateDescriptions = debounce(updateAllImageDescriptions, 300)

  // Função para gerar o texto do relatório
  const generateReportText = useCallback((dataFiltro) => {
    const dados = JSON.parse(localStorage.getItem("bicadaData") || "[]")
    const filteredData = dataFiltro ? dados.filter((item) => item.data === dataFiltro) : dados

    if (filteredData.length === 0) {
      return null // Retorna null se não houver dados
    }

    let relatorio = `RELATÓRIO DE PERDAS - ${dataFiltro || "TODOS OS DADOS"}\n`
    relatorio += `Gerado em: ${new Date().toLocaleString("pt-BR")}\n`
    relatorio += `${"=".repeat(60)}\n\n`

    let totalTrocaPDV = 0
    let totalVencimento = 0
    let totalPerdaArmazen = 0
    let totalPerdaEntrega = 0

    filteredData.forEach((item, index) => {
      relatorio += `${index + 1}. Data: ${item.data}\n`
      relatorio += `   Caminhão: ${item.caminhao}\n`
      relatorio += `   Troca PDV: ${item.trocaPDV || "0"}\n`
      relatorio += `   Vencimento: ${item.vencimento || "0"}\n`
      relatorio += `   Perda Armazen: ${item.perdaArmazen || "0"}\n`
      relatorio += `   Perda Entrega: ${item.perdaEntrega || "0"}\n`
      if (item.observacoes) {
        relatorio += `   Observações: ${item.observacoes}\n`
      }
      relatorio += `   ${"-".repeat(40)}\n`

      totalTrocaPDV += Number.parseInt(item.trocaPDV) || 0
      totalVencimento += Number.parseInt(item.vencimento) || 0
      totalPerdaArmazen += Number.parseInt(item.perdaArmazen) || 0
      totalPerdaEntrega += Number.parseInt(item.perdaEntrega) || 0
    })

    relatorio += `\nRESUMO:\n`
    relatorio += `Total de registros: ${filteredData.length}\n`
    relatorio += `🔄 Total Troca PDV: ${totalTrocaPDV}\n`
    relatorio += `📅 Total Vencimento: ${totalVencimento}\n`
    relatorio += `📦 Total Perda Armazen: ${totalPerdaArmazen}\n`
    relatorio += `🚚 Total Perda Entrega: ${totalPerdaEntrega}\n`
    relatorio += `TOTAL GERAL: ${totalTrocaPDV + totalVencimento + totalPerdaArmazen + totalPerdaEntrega}\n`
    relatorio += `${"=".repeat(60)}\n`

    return relatorio
  }, [])

  // Função para enviar o relatório para o Telegram como um arquivo .txt
  const sendReportToTelegram = useCallback(
    async (reportText, bot, chatId, buttonId, reportFileName = "relatorio.txt") => {
      const sendButton = document.getElementById(buttonId) as HTMLButtonElement | null
      if (sendButton) {
        sendButton.disabled = true
        sendButton.textContent = "⏳ Enviando..."
        sendButton.style.opacity = "0.7"
        sendButton.style.cursor = "not-allowed"
        sendButton.classList.add("sending")
      }
      setIsSendingReport(true)

      if (!bot || !chatId) {
        showStatus("Preencha bot e chat ID", "error")
        if (sendButton) {
          sendButton.disabled = false
          sendButton.textContent = "🚀 Enviar para Telegram"
          sendButton.style.opacity = "1"
          sendButton.style.cursor = "pointer"
          sendButton.classList.remove("sending")
        }
        setIsSendingReport(false)
        return false // Indica falha
      }

      // Check connection status before attempting upload
      if (connectionStatus === "offline") {
        showStatus("Sem conexão. Relatório salvo para envio posterior.", "processing")
        const pendingReports = JSON.parse(localStorage.getItem("pendingReports") || "[]")
        pendingReports.push({
          bot,
          chatId,
          text: reportText,
          timestamp: Date.now(),
          type: "manual_report",
          reportFileName,
        })
        localStorage.setItem("pendingReports", JSON.stringify(pendingReports))
        if (sendButton) {
          sendButton.disabled = false
          sendButton.textContent = "📤 Pendente"
          sendButton.style.opacity = "1"
          sendButton.style.background = "#ffc107"
          sendButton.style.cursor = "pointer"
          sendButton.classList.remove("sending")
        }
        setIsSendingReport(false)
        return false // Indica falha
      }

      if (connectionStatus === "unstable") {
        showStatus("Conexão instável. Tentando enviar relatório...", "processing")
      } else {
        showStatus("Enviando relatório para Telegram...", "processing")
      }

      try {
        await new Promise((resolve) => setTimeout(resolve, 500))

        const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" })
        const formData = new FormData()
        formData.append("chat_id", chatId)
        formData.append("document", blob, reportFileName) // Envia como arquivo
        formData.append("caption", `📊 Relatório de Perdas - ${reportFileName.replace(".txt", "")}`) // Legenda da mensagem

        const response = await fetch(`https://api.telegram.org/bot${bot}/sendDocument`, {
          // Usar sendDocument
          method: "POST",
          body: formData,
        })

        const data = await response.json()

        await new Promise((resolve) => setTimeout(resolve, 1000))

        if (data.ok) {
          showStatus("Relatório enviado com sucesso!", "success")
          if (sendButton) {
            sendButton.disabled = true
            sendButton.textContent = "✅ Enviado"
            sendButton.style.opacity = "1"
            sendButton.style.background = "#28a745"
            sendButton.classList.remove("sending")
          }
          return true // Indica sucesso
        } else {
          throw new Error(data.description || "Erro desconhecido")
        }
      } catch (error) {
        console.error("Telegram send report error:", error)
        if (connectionStatus === "unstable" || error.message.includes("network") || error.message.includes("timeout")) {
          showStatus("Conexão instável. Relatório salvo para reenvio.", "processing")
          const pendingReports = JSON.parse(localStorage.getItem("pendingReports") || "[]")
          pendingReports.push({
            bot,
            chatId,
            text: reportText,
            timestamp: Date.now(),
            type: "manual_report",
            reportFileName,
          })
          localStorage.setItem("pendingReports", JSON.stringify(pendingReports))
          if (sendButton) {
            sendButton.disabled = false
            sendButton.textContent = "📤 Pendente"
            sendButton.style.opacity = "1"
            sendButton.style.background = "#ffc107"
            sendButton.style.cursor = "pointer"
            sendButton.classList.remove("sending")
          }
        } else {
          showStatus("Erro ao enviar relatório: " + error.message, "error")
          if (sendButton) {
            sendButton.disabled = false
            sendButton.textContent = "❌ Falha - Tentar novamente"
            sendButton.style.opacity = "1"
            sendButton.style.background = "#dc3545"
            sendButton.style.cursor = "pointer"
            sendButton.classList.remove("sending")
          }
        }
        return false // Indica falha
      } finally {
        setIsSendingReport(false)
      }
    },
    [connectionStatus],
  )

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Monitor connection status
    const updateConnectionStatus = () => {
      setConnectionStatus(navigator.onLine ? "online" : "offline")
    }

    window.addEventListener("online", updateConnectionStatus)
    window.addEventListener("offline", updateConnectionStatus)
    updateConnectionStatus()

    // Check pending uploads on load
    const checkPendingUploads = () => {
      const pending = JSON.parse(localStorage.getItem("pendingUploads") || "[]")
      setPendingUploads(pending.length)
    }
    checkPendingUploads()

    initializeApp()
    setupDailyReport()
    setupConnectionMonitoring()

    // Setup connection monitoring and retry mechanism
    function setupConnectionMonitoring() {
      // Check connection quality periodically
      setInterval(checkConnectionQuality, 30000) // Every 30 seconds

      // Retry pending uploads when connection is restored
      window.addEventListener("online", () => {
        setTimeout(retryPendingUploads, 2000) // Wait 2 seconds after connection is restored
      })

      // Initial retry attempt
      if (navigator.onLine) {
        setTimeout(retryPendingUploads, 5000) // Wait 5 seconds after page load
      }
    }

    async function checkConnectionQuality() {
      if (!navigator.onLine) {
        setConnectionStatus("offline")
        return
      }

      try {
        const startTime = Date.now()
        const response = await fetch("https://www.google.com/favicon.ico", {
          method: "HEAD",
          cache: "no-cache",
        })
        const endTime = Date.now()
        const responseTime = endTime - startTime

        if (response.ok) {
          if (responseTime < 1000) {
            setConnectionStatus("online")
          } else if (responseTime < 3000) {
            setConnectionStatus("slow")
          } else {
            setConnectionStatus("unstable")
          }
        } else {
          setConnectionStatus("unstable")
        }
      } catch (error) {
        setConnectionStatus("unstable")
      }
    }

    async function retryPendingUploads() {
      const pendingUploads = JSON.parse(localStorage.getItem("pendingUploads") || "[]")
      const pendingReports = JSON.parse(localStorage.getItem("pendingReports") || "[]")

      if (pendingUploads.length === 0 && pendingReports.length === 0) {
        setPendingUploads(0)
        return
      }

      console.log(
        `Tentando reenviar ${pendingUploads.length} uploads e ${pendingReports.length} relatórios pendentes...`,
      )

      // Retry image uploads
      for (let i = pendingUploads.length - 1; i >= 0; i--) {
        const upload = pendingUploads[i]

        try {
          const success = await attemptUpload(upload)

          if (success) {
            // Remove from pending list
            pendingUploads.splice(i, 1)
            localStorage.setItem("pendingUploads", JSON.stringify(pendingUploads))
            setPendingUploads(pendingUploads.length)

            // Update button status
            const button = document.getElementById(upload.buttonId) as any
            if (button) {
              button.disabled = true
              button.textContent = "✅ Enviado"
              button.style.background = "#28a745"
            }

            showStatus(`Upload pendente enviado com sucesso!`, "success")
          }
        } catch (error) {
          console.error("Erro ao reenviar upload:", error)
        }

        // Wait between attempts to avoid overwhelming the connection
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      // Retry pending reports
      for (let i = pendingReports.length - 1; i >= 0; i--) {
        const report = pendingReports[i]
        try {
          const botElement = document.getElementById("bot") as any
          const chatIdElement = document.getElementById("chatId") as any
          const bot = botElement?.value?.trim?.()
          const chatId = chatIdElement?.value?.trim?.()

          if (bot && chatId) {
            const success = await sendReportToTelegram(
              report.text,
              bot,
              chatId,
              `report-btn-${report.timestamp}`,
              report.reportFileName,
            )
            if (success) {
              pendingReports.splice(i, 1)
              localStorage.setItem("pendingReports", JSON.stringify(pendingReports))
              showStatus(`Relatório pendente enviado com sucesso!`, "success")
            }
          }
        } catch (error) {
          console.error("Erro ao reenviar relatório pendente:", error)
        }
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    async function attemptUpload(uploadData) {
      try {
        const blob = await (await fetch(uploadData.dataURL)).blob()
        const formData = new FormData()
        formData.append("chat_id", uploadData.chatId)
        formData.append("caption", uploadData.caption || "Imagem marcada via MarcaFoto")
        formData.append("photo", blob, "imagem.jpg")

        const response = await fetch(`https://api.telegram.org/bot${uploadData.bot}/sendPhoto`, {
          method: "POST",
          body: formData,
        })

        const data = await response.json()
        return data.ok
      } catch (error) {
        console.error("Upload attempt failed:", error)
        return false
      }
    }

    function addToPendingUploads(uploadData) {
      const pendingUploads = JSON.parse(localStorage.getItem("pendingUploads") || "[]")
      pendingUploads.push({
        ...uploadData,
        timestamp: Date.now(),
        attempts: 0,
      })
      localStorage.setItem("pendingUploads", JSON.stringify(pendingUploads))
      setPendingUploads(pendingUploads.length)
    }

    // Setup daily report scheduler
    function setupDailyReport() {
      const checkTime = () => {
        const now = new Date()
        const hours = now.getHours()
        const minutes = now.getMinutes()

        // Verifica se são 23:59
        if (hours === 23 && minutes === 59) {
          enviarRelatorioAutomatico()
        }
      }

      // Verifica a cada minuto
      setInterval(checkTime, 60000)
    }

    async function enviarRelatorioAutomatico() {
      try {
        const hoje = new Date()
        const dataFormatada = `${String(hoje.getDate()).padStart(2, "0")}/${String(hoje.getMonth() + 1).padStart(2, "0")}/${hoje.getFullYear()}`
        const reportFileName = `relatorio_diario_${dataFormatada.replace(/\//g, "-")}.txt`

        const relatorioTexto = generateReportText(dataFormatada)

        if (!relatorioTexto) {
          console.log("Nenhum dado para enviar no relatório automático")
          return
        }

        // Enviar para Telegram
        const botElement = getElement("bot")
        const chatIdElement = getElement("chatId")

        if (botElement && chatIdElement) {
          const bot = botElement?.value?.trim?.() || ""
          const chatId = chatIdElement?.value?.trim?.() || ""

          if (bot && chatId) {
            await sendReportToTelegram(relatorioTexto, bot, chatId, `auto-report-btn-${Date.now()}`, reportFileName) // Usar um ID único
          }
        }
      } catch (error) {
        console.error("Erro ao enviar relatório automático:", error)
      }
    }

    function initializeApp() {
      // Define all the functions in the global scope
      let stream = null
      const cameraContainer = getElement("camera-container")
      const cameraView = getElement("camera-view")
      const upload = getElement("upload")
      const fileNameDisplay = getElement("file-name")
      const galeria = getElement("galeria")
      const statusDisplay = getElement("status")

      // Attach event listener to file input
      if (upload) {
        upload.addEventListener("change", (e: any) => {
          const files = Array.from(e.target?.files || []) as File[]
          if (files.length > 0) {
            if (fileNameDisplay) {
              fileNameDisplay.textContent = files.map((f: File) => f.name).join(", ")
            }
            files.forEach((file) => processarArquivo(file))
          }
        })
      }

      // Define all functions in the global scope
      window.startCamera = () => {
        if (!cameraContainer || !cameraView) return
        cameraContainer.style.display = "block"
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: "environment" } })
          .then((s) => {
            stream = s
            cameraView.srcObject = s
          })
          .catch(() => showStatus("Erro ao acessar a câmera", "error"))
      }

      window.stopCamera = () => {
        if (!cameraContainer) return
        if (stream) {
          stream.getTracks().forEach((t) => t.stop())
          stream = null
        }
        cameraContainer.style.display = "none"
      }

      window.capturePhoto = () => {
        if (!cameraView) return
        const canvas = document.createElement("canvas")
        canvas.width = cameraView.videoWidth
        canvas.height = cameraView.videoHeight
        const ctx = canvas.getContext("2d")
        ctx.drawImage(cameraView, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          const file = new File([blob], `foto_${Date.now()}.jpg`, { type: "image/jpeg" })
          processarArquivo(file)
        }, "image/jpeg")
        window.stopCamera()
      }

      window.enviarParaTelegram = async (dataURL, buttonId, descricao = "") => {
        const botElement = getElement("bot")
        const chatIdElement = getElement("chatId")
        const sendButton = getElement(buttonId)

        if (sendButton) {
          sendButton.disabled = true
          sendButton.textContent = "⏳ Enviando..."
          sendButton.style.opacity = "0.7"
          sendButton.style.cursor = "not-allowed"
          sendButton.classList.add("sending")
        }

        const bot = botElement?.value?.trim?.()
        const chatId = chatIdElement?.value?.trim?.()

        if (!bot || !chatId) {
          showStatus("Preencha bot e chat ID", "error")
          if (sendButton) {
            sendButton.disabled = false
            sendButton.textContent = "🚀 Enviar para Telegram"
            sendButton.style.opacity = "1"
            sendButton.style.cursor = "pointer"
            sendButton.classList.remove("sending")
          }
          return
        }

        // Check connection status before attempting upload
        if (connectionStatus === "offline") {
          showStatus("Sem conexão. Imagem salva para envio posterior.", "processing")
          addToPendingUploads({
            dataURL,
            bot,
            chatId,
            buttonId,
            caption: "Imagem marcada via MarcaFoto",
          })

          if (sendButton) {
            sendButton.disabled = false
            sendButton.textContent = "📤 Pendente"
            sendButton.style.opacity = "1"
            sendButton.style.background = "#ffc107"
            sendButton.style.cursor = "pointer"
            sendButton.classList.remove("sending")
          }
          return
        }

        if (connectionStatus === "unstable") {
          showStatus("Conexão instável. Tentando enviar...", "processing")
        } else {
          showStatus("Enviando para Telegram...", "processing")
        }

        try {
          await new Promise((resolve) => setTimeout(resolve, 500))

          const blob = await (await fetch(dataURL)).blob()
          const formData = new FormData()
          formData.append("chat_id", chatId)
          formData.append("caption", descricao || "Imagem enviada via MarcaFoto")
          formData.append("photo", blob, "imagem.jpg")

          const response = await fetch(`https://api.telegram.org/bot${bot}/sendPhoto`, {
            method: "POST",
            body: formData,
          })

          const data = await response.json()

          await new Promise((resolve) => setTimeout(resolve, 1000))

          if (data.ok) {
            showStatus("Enviado com sucesso!", "success")
            if (sendButton) {
              sendButton.disabled = true
              sendButton.textContent = "✅ Enviado"
              sendButton.style.opacity = "1"
              sendButton.style.background = "#28a745"
              sendButton.classList.remove("sending")
            }

            // Mostrar diálogo de refugo após envio bem-sucedido
            setTimeout(() => {
              setShowRefugoDialog(true)
            }, 1500)
          } else {
            throw new Error(data.description || "Erro desconhecido")
          }
        } catch (error) {
          console.error("Telegram send error:", error)

          // Add to pending uploads if connection issues
          if (
            connectionStatus === "unstable" ||
            error.message.includes("network") ||
            error.message.includes("timeout")
          ) {
            showStatus("Conexão instável. Imagem salva para reenvio.", "processing")
            addToPendingUploads({
              dataURL,
              bot,
              chatId,
              buttonId,
              caption: "Imagem marcada via MarcaFoto",
            })

            if (sendButton) {
              sendButton.disabled = false
              sendButton.textContent = "📤 Pendente"
              sendButton.style.opacity = "1"
              sendButton.style.background = "#ffc107"
              sendButton.style.cursor = "pointer"
              sendButton.classList.remove("sending")
            }
          } else {
            showStatus("Erro ao enviar: " + error.message, "error")
            if (sendButton) {
              sendButton.disabled = false
              sendButton.textContent = "❌ Falha - Tentar novamente"
              sendButton.style.opacity = "1"
              sendButton.style.background = "#dc3545"
              sendButton.style.cursor = "pointer"
              sendButton.classList.remove("sending")
            }
          }
        }
      }

      // Function to retry all pending uploads manually
      window.retryAllPending = async () => {
        await retryPendingUploads()
      }

      // Function to save data to localStorage
      function salvarDados(dados) {
        try {
          const dadosExistentes = JSON.parse(localStorage.getItem("bicadaData") || "[]")
          dadosExistentes.push(dados)
          localStorage.setItem("bicadaData", JSON.stringify(dadosExistentes))
        } catch (error) {
          console.error("Erro ao salvar dados:", error)
        }
      }

      // Function to update data in localStorage
      window.atualizarDados = (timestamp, novosDados) => {
        try {
          const dados = JSON.parse(localStorage.getItem("bicadaData") || "[]")
          const index = dados.findIndex((item) => item.timestamp === timestamp)
          if (index !== -1) {
            dados[index] = { ...dados[index], ...novosDados }
            localStorage.setItem("bicadaData", JSON.stringify(dados))
            return true
          }
          return false
        } catch (error) {
          console.error("Erro ao atualizar dados:", error)
          return false
        }
      }

      // Function to get data from localStorage
      window.obterDados = (dataFiltro = null) => {
        try {
          const dados = JSON.parse(localStorage.getItem("bicadaData") || "[]")
          if (dataFiltro) {
            return dados.filter((item) => item.data === dataFiltro)
          }
          return dados
        } catch (error) {
          console.error("Erro ao obter dados:", error)
          return []
        }
      }

      // Function to generate report (for local download)
      window.gerarRelatorio = (dataFiltro) => {
        const relatorio = generateReportText(dataFiltro)

        if (!relatorio) {
          showStatus("Nenhum dado encontrado para a data selecionada", "error")
          return
        }

        const blob = new Blob([relatorio], { type: "text/plain;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        const fileName = `relatorio_perdas_${dataFiltro ? dataFiltro.replace(/\//g, "-") : "completo"}_${new Date().toISOString().split("T")[0]}.txt`
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        showStatus("Relatório gerado e baixado com sucesso!", "success")
      }

      function processarArquivo(file) {
        const reader = new FileReader()
        reader.onload = () => {
          const imagem = new Image()
          imagem.onload = () => {
            const canvas = document.createElement("canvas")
            const ctx = canvas.getContext("2d")

            const maxWidth = 900
            const scale = maxWidth / imagem.width
            canvas.width = maxWidth
            canvas.height = imagem.height * scale
            ctx.drawImage(imagem, 0, 0, canvas.width, canvas.height)

            // Processar diretamente com dados manuais
            finalizarProcessamento(canvas, ctx)
          }
          imagem.src = (reader.result as string) || ""
        }
        reader.readAsDataURL(file)
      }

      function finalizarProcessamento(canvas, ctx) {
        const caminhao = manualData.caminhao || "Não informado"
        const trocaPDV = manualData.trocaPDV || "0"
        const vencimento = manualData.vencimento || "0"
        const perdaArmazen = manualData.perdaArmazen || "0"
        const perdaEntrega = manualData.perdaEntrega || "0"
        const observacoes = manualData.observacoes || ""
        const data = dataAjustada() // dataAjustada agora está acessível
        const timestamp = Date.now()

        // Save data to localStorage
        const dadosRegistro = {
          data,
          caminhao,
          trocaPDV,
          vencimento,
          perdaArmazen,
          perdaEntrega,
          observacoes,
          timestamp,
        }
        salvarDados(dadosRegistro)

        // Gerar descrição para a legenda do Telegram
        let descricao = `🚛 CAMINHÃO: ${caminhao}\n🔄 TROCA PDV: ${trocaPDV}\n`

        // Adicionar perdas apenas se houver valores
        if (vencimento !== "0") descricao += `📅 VENCIMENTO: ${vencimento}\n`
        if (perdaArmazen !== "0") descricao += `📦 PERDA ARMAZEN: ${perdaArmazen}\n`
        if (perdaEntrega !== "0") descricao += `🚚 PERDA ENTREGA: ${perdaEntrega}\n`
        if (observacoes) descricao += `📝 OBS: ${observacoes}\n`

        descricao += `📅 DATA: ${data}`

        // Usar apenas a imagem original sem marca d'água
        const dataURL = canvas.toDataURL("image/jpeg", 0.9)

        // Adicionar à lista de fotos processadas
        setCurrentProcessedPhotos((prev) => [...prev, timestamp])

        if (galeria) {
          const buttonId = `telegram-btn-${timestamp}`
          const editButtonId = `edit-btn-${timestamp}`
          const div = document.createElement("div")
          div.className = "item"
          div.id = `item-${timestamp}`
          div.innerHTML = `
    <img src="${dataURL}" alt="Imagem processada" id="img-${timestamp}">
    <div style="font-size: 12px; background: rgba(26, 42, 108, 0.1); padding: 8px; border-radius: 5px; margin: 5px 0;">
      <strong>Informações que serão enviadas:</strong><br>
      ${descricao.replace(/\n/g, "<br>")}
    </div>
    <div style="display: flex; gap: 5px; margin-top: 10px;">
      <a href="${dataURL}" download="imagem_${timestamp}.jpg" style="flex: 1;">
        <button style="width: 100%; margin: 0;">⬇️ Baixar</button>
      </a>
      <button id="${editButtonId}" onclick="window.editarItem(${timestamp})" style="width: 40px; margin: 0; background: #ffc107;">✏️</button>
    </div>
    <button id="${buttonId}" class="telegram-btn" onclick="window.enviarParaTelegram('${dataURL}', '${buttonId}', \`${descricao.replace(/`/g, "\\`")}\`)">🚀 Enviar para Telegram</button>
  `
          // Inserir no início da galeria para mostrar as mais recentes primeiro
          galeria.insertBefore(div, galeria.firstChild)
        }
      }

      // Função para editar item
      window.editarItem = (timestamp) => {
        const dados = JSON.parse(localStorage.getItem("bicadaData") || "[]")
        const item = dados.find((d) => d.timestamp === timestamp)

        if (item) {
          setEditingItem(timestamp)
          setEditForm({
            trocaPDV: item.trocaPDV || "",
            vencimento: item.vencimento || "",
            perdaArmazen: item.perdaArmazen || "",
            perdaEntrega: item.perdaEntrega || "",
            observacoes: item.observacoes || "",
            caminhao: item.caminhao,
          })
        }
      }

      // Função para atualizar imagem editada
      window.atualizarImagemEditada = (timestamp, novosDados) => {
        // Atualizar dados no localStorage
        if (window.atualizarDados(timestamp, novosDados)) {
          // Encontrar o item na galeria
          const itemElement = document.getElementById(`item-${timestamp}`)

          if (itemElement) {
            // Gerar nova descrição
            let novaDescricao = `🚛 CAMINHÃO: ${novosDados.caminhao}\n🔄 TROCA PDV: ${novosDados.trocaPDV}\n`

            if (novosDados.vencimento !== "0") novaDescricao += `📅 VENCIMENTO: ${novosDados.vencimento}\n`
            if (novosDados.perdaArmazen !== "0")
              novaDescricao += `📦 PERDA ARMAZEN: ${novosDados.perdaArmazen}\n`
            if (novosDados.perdaEntrega !== "0")
              novaDescricao += `🚚 PERDA ENTREGA: ${novosDados.perdaEntrega}\n`
            if (novosDados.observacoes)
              novaDescricao += `📝 OBS: ${novosDados.observacoes}\n`

            novaDescricao += `📅 DATA: ${novosDados.data}`

            // Atualizar a descrição exibida
            const descricaoDiv = itemElement.querySelector('div[style*="background: rgba(26, 42, 108, 0.1)"]')
            if (descricaoDiv) {
              descricaoDiv.innerHTML = `<strong>Informações que serão enviadas:</strong><br>${novaDescricao.replace(/\n/g, "<br>")}`
            }

            // Atualizar o botão do Telegram com nova descrição
            const telegramBtn = itemElement.querySelector(".telegram-btn")
            if (telegramBtn) {
              const imgElement = getElement(`img-${timestamp}`)
              const dataURL = imgElement?.src || ""
              ;(telegramBtn as any).onclick = () => window.enviarParaTelegram(dataURL, (telegramBtn as any).id, novaDescricao)
            }

            showStatus("Informações atualizadas com sucesso!", "success")
          }
        }
      }
    }

    return () => {
      window.removeEventListener("online", updateConnectionStatus)
      window.removeEventListener("offline", updateConnectionStatus)
    }
  }, [dataAjustada, generateReportText, sendReportToTelegram]) // Adiciona dependências para useCallback

  const formatDateForInput = (dateString) => {
    if (!dateString) return ""
    const [day, month, year] = dateString.split("/")
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  }

  const formatDateFromInput = (dateString) => {
    if (!dateString) return ""
    const [year, month, day] = dateString.split("-")
    return `${day}/${month}/${year}`
  }

  const handleEditSubmit = () => {
    if (editingItem && window.atualizarImagemEditada) {
      const dadosAtualizados = {
        ...editForm,
        timestamp: editingItem,
      }
      window.atualizarImagemEditada(editingItem, dadosAtualizados)
      setEditingItem(null)
      setEditForm({
        trocaPDV: "",
        vencimento: "",
        perdaArmazen: "",
        perdaEntrega: "",
        observacoes: "",
        caminhao: "",
      })
    }
  }

  const handleRefugoResponse = (refugoRealizado) => {
    setShowRefugoDialog(false)

    if (refugoRealizado) {
      // Limpar todas as fotos da galeria
      const galeria = document.getElementById("galeria")
      if (galeria) {
        galeria.innerHTML = ""
      }

      // Resetar dados manuais
      setManualData({
        caminhao: "",
        trocaPDV: "0",
        vencimento: "0",
        perdaArmazen: "0",
        perdaEntrega: "0",
        observacoes: "",
      })

      // Resetar lista de fotos processadas
      setCurrentProcessedPhotos([])

      showStatus("Coleta finalizada! Sistema limpo para novo caminhão.", "success")
    } else {
      showStatus("Coleta não finalizada. Continue adicionando fotos.", "processing")
    }
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "online":
        return "#28a745"
      case "slow":
        return "#ffc107"
      case "unstable":
        return "#fd7e14"
      case "offline":
        return "#dc3545"
      default:
        return "#6c757d"
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "online":
        return "🟢 Online"
      case "slow":
        return "🟡 Lenta"
      case "unstable":
        return "🟠 Instável"
      case "offline":
        return "🔴 Offline"
      default:
        return "⚪ Verificando..."
    }
  }

  const handleSendReportToTelegramClick = async (fullReport = false) => {
    const botElement = getElement("bot")
    const chatIdElement = getElement("chatId")
    const bot = botElement?.value?.trim?.() || ""
    const chatId = chatIdElement?.value?.trim?.() || ""

    if (!bot || !chatId) {
      showStatus("Preencha o Token do Bot e o Chat ID do Telegram para enviar o relatório.", "error")
      return
    }

    const dataToFilter = fullReport ? null : reportDate
    const reportText = generateReportText(dataToFilter)

    if (!reportText) {
      showStatus("Nenhum dado para gerar o relatório.", "error")
      return
    }

    const reportFileName = `relatorio_perdas_${dataToFilter ? dataToFilter.replace(/\//g, "-") : "completo"}_${new Date().toISOString().split("T")[0]}.txt`

    await sendReportToTelegram(reportText, bot, chatId, `manual-report-telegram-btn-${Date.now()}`, reportFileName)
  }

  return (
    <div className="marca-foto-container">
      <div className="container">
        <header>
          <h1>
            <img
              src="/images/image.png"
              alt="Lippaus - Juntos com o Varejo"
              className="logo"
              style={{ height: "80px", width: "auto" }}
            />
          </h1>
        </header>

        {/* Connection Status Bar */}
        <div
          style={{
            background: getConnectionStatusColor(),
            color: "white",
            padding: "8px 15px",
            borderRadius: "8px",
            marginBottom: "15px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "14px",
          }}
        >
          <span>
            <strong>Conexão:</strong> {getConnectionStatusText()}
          </span>
          {pendingUploads > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span>📤 {pendingUploads} pendente(s)</span>
              <button
                onClick={() => window.retryAllPending && window.retryAllPending()}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  cursor: "pointer",
                  margin: 0,
                }}
              >
                🔄 Reenviar
              </button>
            </span>
          )}
        </div>

        {/* Manual Data Input Section */}
        <div style={{ marginTop: "20px", padding: "15px", background: "rgba(26, 42, 108, 0.1)", borderRadius: "10px" }}>
          <button
            onClick={() => setShowManualInput(!showManualInput)}
            style={{
              background: "#1a2a6c",
              color: "white",
              marginBottom: "10px",
              width: "100%",
            }}
          >
            {showManualInput ? "🔼 Ocultar Dados Manuais" : "🔽 Inserir Dados Manuais"}
          </button>

          {showManualInput && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <label>Caminhão:</label>
              <select
                value={manualData.caminhao}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === "OUTRO") {
                    const newData = { ...manualData, caminhao: "" }
                    setManualData(newData)
                    debouncedUpdateDescriptions(newData)
                  } else {
                    const newData = { ...manualData, caminhao: value }
                    setManualData(newData)
                    debouncedUpdateDescriptions(newData)
                  }
                }}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
              >
                <option value="">Selecione um caminhão</option>
                <option value="RQR-4J50">RQR-4J50</option>
                <option value="RQR-4J42">RQR-4J42</option>
                <option value="RQS-0I92">RQS-0I92</option>
                <option value="SFP-4J14">SFP-4J14</option>
                <option value="SFP-4I75">SFP-4I75</option>
                <option value="SFP-4J08">SFP-4J08</option>
                <option value="RQR-4J76">RQR-4J76</option>
                <option value="RQR-1D60">RQR-1D60</option>
                <option value="SFP-4I95">SFP-4I95</option>
                <option value="RQR-4J93">RQR-4J93</option>
                <option value="QRD-0J81">QRD-0J81</option>
                <option value="RQS-2F30">RQS-2F30</option> {/* Novo modelo de caminhão adicionado */}
                <option value="OUTRO">Outro (digite abaixo)</option>
              </select>

              {manualData.caminhao === "" && document.querySelector("select")?.value === "OUTRO" && (
                <input
                  type="text"
                  placeholder="Digite o código do caminhão"
                  onChange={(e) => {
                    const newData = { ...manualData, caminhao: e.target.value }
                    setManualData(newData)
                    debouncedUpdateDescriptions(newData)
                  }}
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
                />
              )}

              <label>Troca PDV:</label>
              <input
                type="number"
                value={manualData.trocaPDV}
                onChange={(e) => {
                  const newData = { ...manualData, trocaPDV: e.target.value }
                  setManualData(newData)
                  debouncedUpdateDescriptions(newData)
                }}
                min="0"
              />

              <label>Tipos de Perdas:</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px", marginBottom: "5px" }}>Vencimento:</label>
                  <input
                    type="number"
                    value={manualData.vencimento}
                    onChange={(e) => {
                      const newData = { ...manualData, vencimento: e.target.value }
                      setManualData(newData)
                      debouncedUpdateDescriptions(newData)
                    }}
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", marginBottom: "5px" }}>Perda Armazen:</label>
                  <input
                    type="number"
                    value={manualData.perdaArmazen}
                    onChange={(e) => {
                      const newData = { ...manualData, perdaArmazen: e.target.value }
                      setManualData(newData)
                      debouncedUpdateDescriptions(newData)
                    }}
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>

              <label>Perda na Entrega:</label>
              <input
                type="number"
                value={manualData.perdaEntrega}
                onChange={(e) => {
                  const newData = { ...manualData, perdaEntrega: e.target.value }
                  setManualData(newData)
                  debouncedUpdateDescriptions(newData)
                }}
                min="0"
                placeholder="0"
              />

              <label>Observações:</label>
              <input
                type="text"
                value={manualData.observacoes}
                onChange={(e) => {
                  const newData = { ...manualData, observacoes: e.target.value }
                  setManualData(newData)
                  debouncedUpdateDescriptions(newData)
                }}
                placeholder="Ex: Informações adicionais sobre a perda"
              />

              <button
                onClick={() => updateAllImageDescriptions(manualData)}
                style={{
                  background: "#17a2b8",
                  color: "white",
                  marginTop: "10px",
                  width: "100%",
                  position: "relative",
                  overflow: "hidden",
                }}
                disabled={updateInProgress || currentProcessedPhotos.length === 0}
              >
                {updateInProgress ? (
                  <>
                    <span style={{ visibility: updateInProgress ? "visible" : "hidden" }}>⏳</span> Atualizando...
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        height: "100%",
                        width: "100%",
                        background: "rgba(255,255,255,0.2)",
                        transform: "translateX(-100%)",
                        animation: "loading 1.5s infinite linear",
                      }}
                    />
                  </>
                ) : (
                  <>🔄 Atualizar Todas as Descrições</>
                )}
              </button>

              <div
                style={{
                  fontSize: "12px",
                  color: "#666",
                  textAlign: "center",
                  marginTop: "5px",
                  fontStyle: "italic",
                }}
              >
                As alterações são aplicadas automaticamente às fotos
              </div>
            </div>
          )}
        </div>

        {/* Galeria de Evidências - Agora no topo */}
        <div style={{ marginTop: "20px" }}>
          <h3 style={{ color: "#1a2a6c", marginBottom: "15px", textAlign: "center" }}>📸 Evidências Capturadas</h3>
          <div className="galeria" id="galeria"></div>
        </div>

        {/* Controles de Upload - Agora na parte inferior */}
        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            background: "rgba(26, 42, 108, 0.05)",
            borderRadius: "15px",
            border: "2px dashed #1a2a6c",
          }}
        >
          <h3 style={{ color: "#1a2a6c", marginBottom: "15px", textAlign: "center" }}>📤 Adicionar Evidências</h3>

          <label className="file-upload">
            <input type="file" id="upload" accept="image/*" hidden multiple />📁 Selecionar Imagens do Dispositivo
          </label>
          <div id="file-name" style={{ textAlign: "center", fontSize: "12px", color: "#666", marginTop: "5px" }}>
            Nenhuma imagem selecionada
          </div>

          <div style={{ textAlign: "center", margin: "15px 0", color: "#666", fontSize: "14px" }}>
            <strong>OU</strong>
          </div>

          <button
            onClick={() => window.startCamera && window.startCamera()}
            style={{
              width: "100%",
              background: "linear-gradient(to right, #1a2a6c, #b21f1f)",
              color: "white",
              padding: "15px",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            📷 Abrir Câmera
          </button>

          <div id="camera-container" style={{ display: "none", marginTop: "15px" }}>
            <video
              id="camera-view"
              autoPlay
              playsInline
              style={{ width: "100%", border: "2px solid #1a2a6c", borderRadius: "8px" }}
            ></video>
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button
                onClick={() => window.capturePhoto && window.capturePhoto()}
                style={{ flex: 1, background: "#28a745" }}
              >
                📸 Capturar Foto
              </button>
              <button
                onClick={() => window.stopCamera && window.stopCamera()}
                style={{ flex: 1, background: "#dc3545" }}
              >
                ❌ Fechar Câmera
              </button>
            </div>
          </div>
        </div>

        <label>Token do Bot Telegram:</label>
        <input type="text" id="bot" readOnly defaultValue="7971190858:AAEuWUmkcnsPGxwb7_IthIOXzuIyGZeosiM" />

        <label>Chat ID do Telegram:</label>
        <input type="text" id="chatId" readOnly defaultValue="-1002515711605" />

        {/* Report Section */}
        <div style={{ marginTop: "20px", padding: "15px", background: "rgba(26, 42, 108, 0.1)", borderRadius: "10px" }}>
          <h3 style={{ color: "#1a2a6c", marginBottom: "15px" }}>📊 Relatórios de Perdas</h3>

          <div
            style={{
              marginBottom: "10px",
              padding: "10px",
              background: "rgba(40, 167, 69, 0.1)",
              borderRadius: "5px",
              fontSize: "12px",
            }}
          >
            <strong>📅 Relatório Automático:</strong> Todos os dias às 23:59 um relatório será enviado automaticamente
            para o Telegram com os dados do dia.
          </div>

          <button
            onClick={() => setShowReport(!showReport)}
            style={{
              background: "#1a2a6c",
              color: "white",
              marginBottom: "10px",
              width: "100%",
            }}
          >
            {showReport ? "🔼 Ocultar Relatórios" : "🔽 Mostrar Relatórios"}
          </button>

          {showReport && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <label>Selecionar Data (opcional):</label>
              <input
                type="date"
                value={formatDateForInput(reportDate)}
                onChange={(e) => setReportDate(formatDateFromInput(e.target.value))}
                style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
              />

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => window.gerarRelatorio && window.gerarRelatorio(reportDate)}
                  style={{
                    background: "#28a745",
                    color: "white",
                    flex: 1,
                  }}
                >
                  📄 Gerar Relatório
                </button>

                <button
                  onClick={() => window.gerarRelatorio && window.gerarRelatorio(null)}
                  style={{
                    background: "#17a2b8",
                    color: "white",
                    flex: 1,
                  }}
                >
                  📋 Relatório Completo
                </button>
              </div>

              <button
                onClick={() => handleSendReportToTelegramClick(false)}
                disabled={isSendingReport}
                id={`manual-report-telegram-btn-${Date.now()}`} // Unique ID for this button
                style={{
                  background: "#007bff",
                  color: "white",
                  marginTop: "10px",
                  width: "100%",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {isSendingReport ? (
                  <>
                    <span style={{ visibility: isSendingReport ? "visible" : "hidden" }}>⏳</span> Enviando para
                    Telegram...
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        height: "100%",
                        width: "100%",
                        background: "rgba(255,255,255,0.2)",
                        transform: "translateX(-100%)",
                        animation: "loading 1.5s infinite linear",
                      }}
                    />
                  </>
                ) : (
                  <>🚀 Enviar Relatório para Telegram</>
                )}
              </button>

              <button
                onClick={() => {
                  if (confirm("Tem certeza que deseja limpar todos os dados salvos?")) {
                    localStorage.removeItem("bicadaData")
                    localStorage.removeItem("pendingUploads")
                    localStorage.removeItem("pendingReports")
                    setPendingUploads(0)
                    alert("Dados limpos com sucesso!")
                  }
                }}
                style={{
                  background: "#dc3545",
                  color: "white",
                  fontSize: "12px",
                  padding: "5px",
                  marginTop: "10px",
                }}
              >
                🗑️ Limpar Todos os Dados
              </button>
            </div>
          )}
        </div>

        {/* Refugo Dialog */}
        {showRefugoDialog && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
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
                width: "90%",
                maxWidth: "400px",
                textAlign: "center",
                boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              }}
            >
              <h3 style={{ marginBottom: "20px", color: "#1a2a6c", fontSize: "20px" }}>� Finalizar Coleta de Dados</h3>
              <p style={{ marginBottom: "25px", fontSize: "16px", lineHeight: "1.4" }}>
                Todos os dados do caminhão <strong>{manualData.caminhao}</strong> foram coletados e enviados?
              </p>

              <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
                <button
                  onClick={() => handleRefugoResponse(true)}
                  style={{
                    background: "#28a745",
                    color: "white",
                    padding: "12px 25px",
                    borderRadius: "8px",
                    border: "none",
                    fontSize: "16px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  ✅ Sim, finalizar coleta
                </button>
                <button
                  onClick={() => handleRefugoResponse(false)}
                  style={{
                    background: "#dc3545",
                    color: "white",
                    padding: "12px 25px",
                    borderRadius: "8px",
                    border: "none",
                    fontSize: "16px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  ❌ Não, continuar coletando
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingItem && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "10px",
                width: "90%",
                maxWidth: "400px",
                maxHeight: "80vh",
                overflowY: "auto",
              }}
            >
              <h3 style={{ marginBottom: "15px", color: "#1a2a6c" }}>✏️ Editar Informações</h3>

              <label>Caminhão:</label>
              <select
                value={editForm.caminhao}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === "OUTRO") {
                    setEditForm({ ...editForm, caminhao: "" })
                  } else {
                    setEditForm({ ...editForm, caminhao: value })
                  }
                }}
                style={{
                  marginBottom: "10px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  width: "100%",
                }}
              >
                <option value="">Selecione um caminhão</option>
                <option value="RQR-4J50">RQR-4J50</option>
                <option value="RQR-4J42">RQR-4J42</option>
                <option value="RQS-0I92">RQS-0I92</option>
                <option value="SFP-4J14">SFP-4J14</option>
                <option value="SFP-4I75">SFP-4I75</option>
                <option value="SFP-4J08">SFP-4J08</option>
                <option value="RQR-4J76">RQR-4J76</option>
                <option value="RQR-1D60">RQR-1D60</option>
                <option value="SFP-4I95">SFP-4I95</option>
                <option value="RQR-4J93">RQR-4J93</option>
                <option value="QRD-0J81">QRD-0J81</option>
                <option value="RQS-2F30">RQS-2F30</option> {/* Novo modelo de caminhão adicionado */}
                <option value="OUTRO">Outro</option>
              </select>

              <label>Troca PDV:</label>
              <input
                type="number"
                value={editForm.trocaPDV}
                onChange={(e) => setEditForm({ ...editForm, trocaPDV: e.target.value })}
                style={{ marginBottom: "10px" }}
              />

              <label>Tipos de Perdas:</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px", marginBottom: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px" }}>Vencimento:</label>
                  <input
                    type="number"
                    value={editForm.vencimento}
                    onChange={(e) => setEditForm({ ...editForm, vencimento: e.target.value })}
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px" }}>Perda Armazen:</label>
                  <input
                    type="number"
                    value={editForm.perdaArmazen}
                    onChange={(e) => setEditForm({ ...editForm, perdaArmazen: e.target.value })}
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>

              <label>Perda na Entrega:</label>
              <input
                type="number"
                value={editForm.perdaEntrega}
                onChange={(e) => setEditForm({ ...editForm, perdaEntrega: e.target.value })}
                style={{ marginBottom: "10px" }}
                min="0"
                placeholder="0"
              />

              <label>Observações:</label>
              <input
                type="text"
                value={editForm.observacoes}
                onChange={(e) => setEditForm({ ...editForm, observacoes: e.target.value })}
                style={{ marginBottom: "10px" }}
                placeholder="Ex: Informações adicionais sobre a perda"
              />

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={handleEditSubmit}
                  style={{
                    background: "#28a745",
                    color: "white",
                    flex: 1,
                  }}
                >
                  ✅ Salvar
                </button>
                <button
                  onClick={() => setEditingItem(null)}
                  style={{
                    background: "#dc3545",
                    color: "white",
                    flex: 1,
                  }}
                >
                  ❌ Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="status" id="status"></div>
      </div>

      <style jsx global>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
