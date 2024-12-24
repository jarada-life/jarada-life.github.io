<?php

header("Permissions-Policy: run-ad-auction=(), private-state-token-redemption=(), private-state-token-issuance=(), join-ad-interest-group=(), browsing-topics=()");

$dirPairs_pre = [
    ['/tools', '/tools/util/jg'],
    ['/tools/', '/tools/util/jg'],
    ['/tools/util', '/tools/util/jg'],
    ['/tools/util/', '/tools/util/jg'],
];
$dirPairs_main = [
    ['/tools', '/tools_20240805052016', false],
    ['/', '/post', true],
    // ['/post', '/post', true],
    ['/index.php', '/post', true],
];
$ignoredir = '/abcde';
$requestUri = $_SERVER['REQUEST_URI'];
$maxRedirects = 10;

if (strpos($requestUri, $ignoredir) === 0) {
    // error_log("except uri : " . $requestUri . ", " . $ignoredir."\r\n"  , 3 , "error.log");
    return false;
}

function fetchContent($url, $basePath, $redirectCount = 0)
{
    global $maxRedirects;
    // error_log("fetch " . $url . ", redirect " . $redirectCount, 3, "error.log");

    if ($redirectCount >= $maxRedirects) {
        error_log("Max redirects reached for URL: " . $url . "\n", 3, "error.log");
        return [null, null];
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HEADER, 1);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 0);
    $response = curl_exec($ch);
    $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $header = substr($response, 0, $header_size);
    $body = substr($response, $header_size);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);


    if ($statusCode == 301 || $statusCode == 302 /* || $statusCode == 307 || $statusCode == 308 */) {
        preg_match('/Location: (.*)/', $header, $matches);
        if (isset($matches[1])) {
            $newUrl = trim($matches[1]);
            if (strpos($newUrl, 'http') !== 0) {
                // If it's a relative URL, make it absolute
                $newUrl = rtrim($basePath, '/') . '/' . ltrim($newUrl, '/');
            }
            error_log("__Redirect (" . $statusCode . ") found. Following to: " . $newUrl . "\n", 3, "error.log");
            return fetchContent($newUrl, $basePath, $redirectCount + 1);
        }
    } else {
        // error_log("Fetched URL: " . $url . ", Status Code: " . $statusCode . "\n", 3, "error.log");
    }

    $redirectUrl = getRedirectUrl($body);
    if ($redirectUrl !== null) {
        $newUrl = rtrim($basePath, '/') . '/' . ltrim($redirectUrl, '/');
        error_log("__NEXT_REDIRECT found. Following to: " . $newUrl . "\n", 3, "error.log");
        return fetchContent($newUrl, $basePath, $redirectCount + 1);
    }


    return [$body, $url];
}
function getRedirectUrl($content)
{
    $patterns = [
        '/"digest":"NEXT_REDIRECT;replace;(.*?);307;"/',
        '/<script>self\.__next_f\.push\(\[1,"4:E{\\\"digest\\\":\\\"NEXT_REDIRECT;replace;(.*?);307;\\\"}\\n"\]\)<\/script>/',
        '/NEXT_REDIRECT;replace;(.*?);307;/'
    ];

    if (strpos($content, 'NEXT_REDIRECT') === false) {
        // error_log("No 'NEXT_REDIRECT' found in content", 3, "error.log");
        return null;
    }

    foreach ($patterns as $index => $pattern) {
        if (preg_match($pattern, $content, $matches)) {
            // error_log("Match found with pattern " . ($index + 1) . ": " . json_encode($matches), 3, "error.log");
            if (isset($matches[1])) {
                return $matches[1];
            }
        }
    }

    // error_log("No matching pattern found for redirect URL", 3, "error.log");
    return null;
}

function getDynamicDir($baseDir)
{
    global $dirPairs_main; // 글로벌 변수 사용 선언
    foreach ($dirPairs_main as $pair) {
        if ($pair[0] === $baseDir) {
            $dynamicDir = $pair[1];
            error_log("dynamicDir : " . $dynamicDir . "\n", 3, "error.log");
            return $dynamicDir;
        }
    }
}
function get404Path()
{
    global $requestUri;
    $dynamicDir = getDynamicDir('/tools');

    if ($dynamicDir !== null) {
        return $_SERVER['DOCUMENT_ROOT'] . '/' . $dynamicDir . '/404.html';
    } else {
        error_log("!!no dynamicDir : " . $requestUri . "\n", 3, "error.log");
        return $_SERVER['DOCUMENT_ROOT'] . '/404.php';
    }
}
function getPageFromCurl($newPath)
{
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://' . $_SERVER['HTTP_HOST'] . $newPath);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    $content = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode == 200) {
        // header("Content-Type: $mime");
        echo $content;
    } else {
        header("HTTP/1.0 $httpCode");
        echo "Error: Unable to fetch content";
    }
}

function runPair($dirPairs, $requestUri)
{
    $newPath = getPairUrl($dirPairs, $requestUri);
    $newPath_file = strtok($newPath, '?'); 
    $filePath = $_SERVER['DOCUMENT_ROOT'] . $newPath_file;

    if (is_dir($filePath)) {
        $filePath .= '/index.html';
    }

    if (file_exists($filePath)) {
        $mime = mime_content_type($filePath);
        // error_log("file exist uri : " . $filePath . ", mime:" . $mime . "\n", 3, "error.log");

        $content = file_get_contents($filePath);
        // error_log("Content length: " . strlen($content) . " bytes\n", 3, "error.log");

        if (strpos($content, 'NEXT_REDIRECT') !== false) {
            // error_log("NEXT_REDIRECT found in content\n", 3, "error.log");
            //preg_match('/"digest":"NEXT_REDIRECT;replace;(.*?);307;"/', $content, $matches);
            $redirectUrl = getRedirectUrl($content);
            // return $redirectUrl;

            if ($redirectUrl != null) {
                // error_log("Redirect URL: " . $redirectUrl . "\n", 3, "error.log");
                list($redirectContent, $finalUrl) = fetchContent('http://' . $_SERVER['HTTP_HOST'] . $newPath . $redirectUrl, 'http://' . $_SERVER['HTTP_HOST'] . $newPath);
                if ($redirectContent !== null) {
                    // error_log("Fetched content from: " . $finalUrl . "\n", 3, "error.log");
                    // error_log("First 200 characters of content: " . substr(substr($redirectContent, 0, 200), 0, 200) . "\n", 3, "error.log");
                    echo $redirectContent;
                } else {
                    error_log("Failed to fetch content after max redirects\n", 3, "error.log");
                    header("HTTP/1.0 500 Internal Server Error");
                }
                exit;
            } else {
                error_log("NEXT_REDIRECT found but couldn't extract URL\n", 3, "error.log");
            }

        } else {
            // error_log("No 307 redirection, returning content as-is\n", 3, "error.log");
            header("Content-Type: $mime");
            echo $content;
            exit;
        }
    } else {
        error_log("File does not exist: " . $filePath . "\n", 3, "error.log");
        return null;
    }
    return $requestUri;
}

function getPairUrl($dirPairs, $requestUri)
{
    foreach ($dirPairs as $pair) {
        $oldDir = $pair[0];
        $newDir = $pair[1];
        $isExactMatch = $pair[2] ?? false;

        if ($isExactMatch) {
            if ($requestUri === $oldDir) {
                return str_replace($oldDir, $newDir, $requestUri);
            }
        } else {
            $pattern = '#^' . preg_quote($oldDir, '#') . '(/|$)#';
            if (preg_match($pattern, $requestUri)) {
                return preg_replace($pattern, $newDir . '$1', $requestUri);
            }
        }
    }
    return $requestUri;
}

function convertPair($dirPairs, $requestUri)
{

    foreach ($dirPairs as $pair) {
        $oldDir = $pair[0];
        $newDir = $pair[1];

        if (
            strpos($requestUri, $oldDir) === 0
            && ($oldDir === $requestUri)
        ) {
            $newPath = str_replace($oldDir, $newDir, $requestUri);
            // error_log("path change : " . $oldDir . ", " . $newPath . "  // origin:  " . $requestUri."\n", 3, "error.log");
            return $newPath;
        }
    }
    return $requestUri;
}

$redirectUrl = convertPair($dirPairs_pre, $requestUri);
$calculatedUrl = runPair($dirPairs_main, $redirectUrl);

if (file_exists($filePath)) {
    if ($newPath == $newPath_file) {
        header("Content-Type: $mime");
        readfile($filePath);
    } else {
        header("Content-Type: $mime");
        getPageFromCurl($newPath);
    }
    exit;
}

header("HTTP/1.0 404 Not Found");
$includePath = get404Path();
include ($includePath);
error_log("!!no file : " . $requestUri . "\n", 3, "error.log");
?>