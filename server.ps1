
# HTTP Server in PowerShell with Admin Save Support
$port = 3000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:${port}/")
$listener.Start()

Write-Host "Server started at http://localhost:${port}"
Start-Process "http://localhost:${port}"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $path = $request.Url.LocalPath
    $method = $request.HttpMethod
    
    # Default to index.html
    if ($path -eq "/") { $path = "/index.html" }
    
    # Remove leading slash for local path resolution
    $relativePath = $path.TrimStart('/')
    $localPath = Join-Path $PWD $relativePath

    if ($method -eq "POST" -and $path -eq "/save") {
        try {
            # Read Body
            $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
            $body = $reader.ReadToEnd()
            $json = $body | ConvertFrom-Json
            
            $filename = $json.filename
            $content = $json.content
            
            # Security: Allow only HTML files in current dir
            if ($filename -match "\.html$") {
                $savePath = Join-Path $PWD $filename
                [System.IO.File]::WriteAllText($savePath, $content)
                 
                $successJson = '{"success": true, "message": "File saved"}'
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($successJson)
                $response.ContentType = "application/json"
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
                Write-Host "Saved: $filename"
            }
            else {
                throw "Invalid filename or extension"
            }
        }
        catch {
            $err = $_.Exception.Message
            Write-Host "Error: $err"
            $errJson = '{"success": false, "message": "' + $err + '"}'
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($errJson)
            $response.StatusCode = 500
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
    }
    elseif (Test-Path $localPath -PathType Leaf) {
        try {
            $contentBytes = [System.IO.File]::ReadAllBytes($localPath)
            $response.ContentLength64 = $contentBytes.Length
            
            if ($localPath -match "\.html$") { $response.ContentType = "text/html" }
            elseif ($localPath -match "\.css$") { $response.ContentType = "text/css" }
            elseif ($localPath -match "\.js$") { $response.ContentType = "application/javascript" }
            elseif ($localPath -match "\.png$") { $response.ContentType = "image/png" }
            elseif ($localPath -match "\.jpg$") { $response.ContentType = "image/jpeg" }
            
            $response.OutputStream.Write($contentBytes, 0, $contentBytes.Length)
        }
        catch {
            $response.StatusCode = 500
        }
    }
    else {
        $response.StatusCode = 404
    }
    
    $response.Close()
}
