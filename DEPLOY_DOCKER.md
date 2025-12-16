# Docker Deployment Guide for NutriDecode AI

Depending on whether you have `docker-compose` or just `docker` installed, choose the method below.

## Prerequisites
- Docker Engine installed.
- Your Gemini API Key ready.

## Method 1: Using Docker Compose (Recommended)

1.  **Create a `.env` file** (if you haven't already) in the root directory with your key:
    ```env
    GEMINI_API_KEY=your_actual_api_key_here
    ```

2.  **Build and Run**:
    Open your terminal in the project folder and run:
    ```bash
    docker-compose up --build -d
    ```

3.  **Access the App**:
    Go to [http://localhost:8080](http://localhost:8080).

## Method 2: Manual Docker Build

1.  **Build the Image**:
    Replace `your_key_here` with your actual API key.
    ```bash
    docker build --build-arg GEMINI_API_KEY=your_key_here -t nutridecode-ai .
    ```

2.  **Run the Container**:
    ```bash
    docker run -d -p 8080:80 --name nutridecode-container nutridecode-ai
    ```

3.  **Access**:
    Go to [http://localhost:8080](http://localhost:8080).

## Troubleshooting
- If the API calls fail, ensure the API Key was correctly passed during the **build** step. Note that Vite embeds the key into the HTML/JS at build time, so changing the key requires rebuilding the image.

### ⚠️ Important: Camera Access & HTTPS
Browsers (Chrome, Safari, Edge) **block camera access** on insecure sites (`http://...`). They only allow camera on:
1.  `localhost` or `127.0.0.1`
2.  **HTTPS** (Secure sites)

Since you are accessing via `http://YOUR_IP:8080`, the camera will be blocked.

**Workaround for Testing:**
1.  Open `chrome://flags/#unsafely-treat-insecure-origin-as-secure` in your browser.
2.  Add your IP address (e.g., `http://103.86.176.223:8080`) to the text box.
3.  Select **Enabled**.
4.  Relaunch Chrome.

**For Production:**
You must set up a domain name and SSL certificate (HTTPS) using tools like Nginx Proxy Manager or Certbot.

### 📱 Testing on Mobile (The Easy Way)
Since mobile browsers (especially iOS) make it hard to enable insecure origins, the easiest way to test on your phone is to use a **Secure Tunnel** like **ngrok**.

1.  **Install ngrok** on your server:
    ```bash
    curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list && sudo apt update && sudo apt install ngrok
    ```
    *(Or download from [ngrok.com](https://ngrok.com/download))*

2.  **Start the Tunnel**:
    Run this command on your server:
    ```bash
    ngrok http 8080
    ```

3.  **Get the Link**:
    ngrok will show a URL like `https://random-name.ngrok-free.app`.
    Open **that HTTPS link** on your mobile phone. The camera will work instantly!
