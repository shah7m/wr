document.addEventListener("DOMContentLoaded", () => {
  const openModalBtn = document.getElementById("openModalBtn")
  const closeModalBtn = document.getElementById("closeModalBtn")
  const modalOverlay = document.getElementById("modalOverlay")
  const form = document.getElementById("reminderForm")
  const submitBtn = document.getElementById("submitBtn")
  const messageContainer = document.getElementById("message-container")
  const btnText = submitBtn.querySelector(".btn-text")
  const recurringInput = document.getElementById("recurring")

  let currentStep = 1
  const totalSteps = 3

  // Modal controls
  openModalBtn.addEventListener("click", () => {
    modalOverlay.classList.add("active")
    document.body.style.overflow = "hidden"
  })

  closeModalBtn.addEventListener("click", closeModal)
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      closeModal()
    }
  })

  function closeModal() {
    modalOverlay.classList.remove("active")
    document.body.style.overflow = "auto"
    resetForm()
  }

  // Initialize and update current time
  const dateInput = document.getElementById("date")
  const timeInput = document.getElementById("time-input")

  console.log("Date input:", dateInput) // Debug log
  console.log("Time input:", timeInput) // Debug log

  // Set today's date as default
  function setTodaysDate() {
    if (dateInput) {
      const today = new Date()
      const dateStr = today.toISOString().split("T")[0]
      dateInput.value = dateStr
      dateInput.min = dateStr
      console.log(`Set default date to: ${dateStr}`) // Debug log
    }
  }

  // Time validation function - ONLY validates, does NOT submit
  function validateTimeStep() {
    const hasDate = dateInput && dateInput.value !== ""
    const hasTime = timeInput && timeInput.value !== ""

    console.log(`Date: ${dateInput?.value}, Time: ${timeInput?.value}`) // Debug log
    console.log(`Has date: ${hasDate}, Has time: ${hasTime}`) // Debug log

    const isValid = hasDate && hasTime

    if (isValid) {
      // Check if time is in the future
      const dateTimeString = `${dateInput.value}T${timeInput.value}`
      const selectedDateTime = new Date(dateTimeString)
      const now = new Date()

      if (selectedDateTime <= now) {
        submitBtn.disabled = true
        console.log("Time is in the past, disabling submit button") // Debug log
        return
      }

      // Update hidden input for form submission
      const hiddenTimeInput = document.getElementById("time")
      if (hiddenTimeInput) {
        hiddenTimeInput.value = dateTimeString
      }

      // Enable submit button
      submitBtn.disabled = false

      console.log(`Time validated: ${dateTimeString}`) // Debug log
      console.log("Submit button enabled - waiting for user to click") // Debug log
    } else {
      submitBtn.disabled = true
    }

    console.log(`Time step valid: ${isValid}, Submit button disabled: ${submitBtn.disabled}`) // Debug log
  }

  // Add event listeners for time inputs
  if (dateInput) {
    dateInput.addEventListener("change", validateTimeStep)
    dateInput.addEventListener("input", validateTimeStep)
  }

  if (timeInput) {
    timeInput.addEventListener("change", validateTimeStep)
    timeInput.addEventListener("input", validateTimeStep)
  }

  // Step navigation
  function showStep(stepNumber) {
    console.log(`Showing step ${stepNumber}`) // Debug log

    // Update progress bar
    const progressFill = document.querySelector(".progress-fill")
    progressFill.style.width = `${(stepNumber / totalSteps) * 100}%`

    // Update step indicators
    document.querySelectorAll(".step").forEach((step, index) => {
      const stepNum = index + 1
      step.classList.remove("active", "completed")

      if (stepNum === stepNumber) {
        step.classList.add("active")
      } else if (stepNum < stepNumber) {
        step.classList.add("completed")
      }
    })

    // Update form steps
    document.querySelectorAll(".form-step").forEach((step) => {
      const stepNum = Number.parseInt(step.dataset.step)
      step.classList.remove("active", "prev")

      if (stepNum === stepNumber) {
        step.classList.add("active")
      } else if (stepNum < stepNumber) {
        step.classList.add("prev")
      }
    })

    currentStep = stepNumber

    // If we're on step 3, validate time immediately
    if (stepNumber === 3) {
      validateTimeStep()
    }
  }

  // Step 1: Message validation
  const messageInput = document.getElementById("message")
  const charCount = document.getElementById("char-count")
  const step1NextBtn = document.querySelector('[data-next="2"]')

  console.log("Message input:", messageInput) // Debug log
  console.log("Char count:", charCount) // Debug log
  console.log("Step 1 next button:", step1NextBtn) // Debug log

  if (messageInput && charCount && step1NextBtn) {
    messageInput.addEventListener("input", (e) => {
      const length = e.target.value.length
      console.log(`Message length: ${length}`) // Debug log

      charCount.textContent = length

      if (length > 160) {
        charCount.style.color = "#f87171"
      } else {
        charCount.style.color = "rgba(255, 255, 255, 0.6)"
      }

      const isValid = length > 0 && length <= 160
      step1NextBtn.disabled = !isValid

      console.log(`Step 1 valid: ${isValid}`) // Debug log
    })

    // Add keyup event as backup
    messageInput.addEventListener("keyup", (e) => {
      const length = e.target.value.length
      charCount.textContent = length
      step1NextBtn.disabled = length === 0 || length > 160
    })
  }

  // Step 2: Phone validation
  const phoneInput = document.getElementById("phone")
  const step2NextBtn = document.querySelector('[data-next="3"]')

  console.log("Phone input:", phoneInput) // Debug log
  console.log("Step 2 next button:", step2NextBtn) // Debug log

  if (phoneInput && step2NextBtn) {
    phoneInput.addEventListener("input", (e) => {
      // Remove any non-digit characters
      let value = e.target.value.replace(/\D/g, "")

      // Limit to 8 digits for Qatar
      if (value.length > 8) {
        value = value.slice(0, 8)
      }

      e.target.value = value

      // Enable next button if we have 8 digits
      const isValid = value.length === 8
      step2NextBtn.disabled = !isValid

      console.log(`Phone: ${value}, valid: ${isValid}`) // Debug log
    })
  }

  // Navigation buttons
  document.querySelectorAll(".next-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault() // Prevent form submission
      const nextStep = Number.parseInt(btn.dataset.next)
      console.log(`Next button clicked, going to step ${nextStep}`) // Debug log
      showStep(nextStep)
    })
  })

  document.querySelectorAll(".back-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault() // Prevent form submission
      const backStep = Number.parseInt(btn.dataset.back)
      console.log(`Back button clicked, going to step ${backStep}`) // Debug log
      showStep(backStep)
    })
  })

  // Submit button click handler - ONLY way to submit
  submitBtn.addEventListener("click", async (e) => {
    e.preventDefault()
    console.log("Submit button clicked - starting submission process") // Debug log

    // Double check all validations
    const messageValue = messageInput?.value || ""
    const phoneValue = phoneInput?.value || ""
    const dateValue = dateInput?.value || ""
    const timeValue = timeInput?.value || ""
    const recurringValue = recurringInput?.value || "none"

    console.log("Form values:", { messageValue, phoneValue, dateValue, timeValue, recurringValue }) // Debug log

    // Validate message
    if (!messageValue || messageValue.length === 0 || messageValue.length > 160) {
      showMessage("Please enter a valid message (1-160 characters)", "error")
      return
    }

    // Validate phone
    if (!phoneValue || phoneValue.length !== 8) {
      showMessage("Please enter a valid 8-digit Qatar phone number", "error")
      return
    }

    // Validate date and time
    if (!dateValue || !timeValue) {
      showMessage("Please select both date and time for your reminder", "error")
      return
    }

    // Create the datetime and validate it's in the future
    const dateTimeString = `${dateValue}T${timeValue}`
    const selectedDateTime = new Date(dateTimeString)
    const currentTime = new Date()

    console.log("Time comparison:", { selectedDateTime, currentTime, isInFuture: selectedDateTime > currentTime }) // Debug log

    if (selectedDateTime <= currentTime) {
      showMessage("Please select a future date and time", "error")
      return
    }

    const data = {
      phone: "974" + phoneValue, // Add Qatar country code
      message: messageValue,
      time: dateTimeString,
      recurring: recurringValue,
    }

    console.log("Submitting data:", data) // Debug log

    setLoadingState(true)

    try {
      const response = await fetch("/api/reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      console.log("Server response:", result) // Debug log

      if (response.ok) {
        const recurringText = recurringValue !== "none" ? ` (${recurringValue})` : ""
        showMessage(`Reminder set successfully${recurringText}! 🎉`, "success")
        setTimeout(() => {
          closeModal()
        }, 2000)
      } else {
        showMessage(result.error || "Failed to set reminder", "error")
      }
    } catch (error) {
      console.error("Network error:", error)
      showMessage("Network error. Please try again.", "error")
    } finally {
      setLoadingState(false)
    }
  })

  // Form submit handler - prevent default form submission
  form.addEventListener("submit", (e) => {
    e.preventDefault()
    console.log("Form submit event prevented - use button click instead") // Debug log
  })

  function resetForm() {
    form.reset()
    showStep(1)

    // Reset all buttons
    const step1NextBtn = document.querySelector('[data-next="2"]')
    const step2NextBtn = document.querySelector('[data-next="3"]')

    if (step1NextBtn) step1NextBtn.disabled = true
    if (step2NextBtn) step2NextBtn.disabled = true
    submitBtn.disabled = true

    // Reset character counter
    if (charCount) charCount.textContent = "0"

    // Set today's date again
    setTodaysDate()
  }

  function setLoadingState(loading) {
    if (loading) {
      submitBtn.disabled = true
      btnText.innerHTML = '<span class="loading"></span> Setting Reminder...'
    } else {
      btnText.textContent = "Set Reminder"
      // Don't re-enable here, let validation handle it
      validateTimeStep()
    }
  }

  function showMessage(message, type) {
    messageContainer.textContent = message
    messageContainer.className = `message-container ${type} show`

    setTimeout(() => {
      messageContainer.classList.remove("show")
    }, 5000)
  }

  function updateCurrentTime() {
    const now = new Date()
    const qatarTime = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Qatar",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(now)

    const currentTimeSpan = document.getElementById("current-time")
    if (currentTimeSpan) {
      currentTimeSpan.textContent = qatarTime
    }
  }

  // Add subtle parallax effect to stars
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.addEventListener("mousemove", (e) => {
      const stars = document.querySelectorAll(".stars, .stars2, .stars3")
      const x = e.clientX / window.innerWidth
      const y = e.clientY / window.innerHeight

      stars.forEach((star, index) => {
        const speed = (index + 1) * 0.5
        star.style.transform = `translate(${x * speed}px, ${y * speed}px)`
      })
    })
  }

  // Initialize everything
  setTodaysDate()
  updateCurrentTime()
  setInterval(updateCurrentTime, 1000)

  console.log("JavaScript loaded and initialized") // Debug log
})
