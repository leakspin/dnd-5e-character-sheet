<?php

require_once 'db.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-User-Session');
header('Content-Type: application/json');

function getSessionUser($db)
{
    if (isset($_SERVER['HTTP_X_USER_SESSION']) && $_SERVER['HTTP_X_USER_SESSION'] != '') {
        [$token, $iv] = explode('::', $_SERVER['HTTP_X_USER_SESSION']);
        $userToken = openssl_decrypt(hex2bin($token), ALG_ENCRYPT, SECRET, OPENSSL_RAW_DATA, hex2bin($iv));
        [$user, $datetime] = explode('|', $userToken);
        $userData = getUserByName($db, $user);
        if ($userData) {
            return $userData;
        }
    }

    throw new Exception('Login required');
}
try {
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        exit;
    } elseif ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_GET['method']) && $_GET['method'] == 'login') {
        $input = json_decode(file_get_contents('php://input'), true);
        $ret = getUserByName($db, $input['user']);
        if (password_verify($input['pass'], $ret['pass'])) {
            $length = openssl_cipher_iv_length(ALG_ENCRYPT);
            $iv = openssl_random_pseudo_bytes($length);
            $encrypted = openssl_encrypt($ret['user'] . '|' . date('YmdHis'), ALG_ENCRYPT, SECRET, OPENSSL_RAW_DATA, $iv);

            logMsg('INFO', 'User ' . $ret['user'] . ' logged successfully');
            sendResponse(['status' => 'OK', 'message' => 'Login successfully', 'data' => ['session' => bin2hex($encrypted) . '::' . bin2hex($iv), 'user' => $ret['user']]]);
        } else {
            sendResponse(['status' => 'ERROR', 'message' => 'Error on login. Please, check user and pass.']);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_GET['method']) && $_GET['method'] == 'register') {
        $input = json_decode(file_get_contents('php://input'), true);
        $ret = registerUser($db, $input['user'], $input['pass']);
        sendResponse(['status' => 'OK', 'message' => 'User registered correctly']);
    } elseif ($_SERVER['REQUEST_METHOD'] == 'GET' && isset($_GET['method']) && $_GET['method'] == 'checkLogin') {
        $user = getSessionUser($db);
        sendResponse(['status' => 'OK', 'data' => ['user' => $user['user']]]);
    } elseif ($_SERVER['REQUEST_METHOD'] == 'GET' && isset($_GET['method']) && $_GET['method'] == 'getCharacters') {
        $user = getSessionUser($db);
        sendResponse(['status' => 'OK', 'data' => getCharacters($db, $user['id'])]);
    } elseif ($_SERVER['REQUEST_METHOD'] == 'GET' && isset($_GET['method']) && $_GET['method'] == 'getCharacter') {
        if (!isset($_GET['id'])) {
            throw new Exception('Character id required.');
        }
        $user = getSessionUser($db);
        sendResponse(['status' => 'OK', 'data' => getCharacter($db, $user['id'], $_GET['id'])]);
    } elseif ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_GET['method']) && $_GET['method'] == 'saveCharacter') {
        $user = getSessionUser($db);
        $input = json_decode(file_get_contents('php://input'), true);
        $characterId = null;

        if (isset($input['characterId'])) {
            $characterId = $input['characterId'];
            unset($input['characterId']);
        }

        sendResponse(['status' => 'OK', 'message' => saveCharacter($db, $user['id'], $input, $characterId)]);
    } else {
        logMsg('INFO', 'Not a valid request received. HTTP Method ' . $_SERVER['REQUEST_METHOD'] . '. Method: ' . ($_GET['method'] ?? 'no method provided') . '.');
        sendResponse([]);
    }
} catch (Exception $e) {
    logMsg('ERROR', $e->getMessage());
    sendResponse(['status' => 'ERROR', 'message' => $e->getMessage()]);
}
