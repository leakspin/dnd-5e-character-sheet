<?php

require_once 'db.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_GET['method']) && $_GET['method'] == 'login') {
        $input = json_decode(file_get_contents('php://input'), true);
        $ret = getUserByName($db, $input['user']);
        if (password_verify($input['pass'], $ret['pass'])) {
            $length = openssl_cipher_iv_length(ALG_ENCRYPT);
            $iv = openssl_random_pseudo_bytes($length);
            $encrypted = openssl_encrypt($ret['user'] . date('YmdHis'), ALG_ENCRYPT, SECRET, OPENSSL_RAW_DATA, $iv);

            logMsg('INFO', 'User ' . $ret['user'] . ' logged successfully');
            response(['status' => 'OK', 'message' => 'Login successfully', 'data' => ['session' => $encrypted]]);
        } else {
            response(['status' => 'ERROR', 'message' => 'Error login. Please, check user and pass.']);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_GET['method']) && $_GET['method'] == 'register') {
        $input = json_decode(file_get_contents('php://input'), true);
        $ret = registerUser($db, $input['user'], $input['pass']);
        logMsg('INFO', 'User ' . $ret['user'] . ' registered successfully');
        response(['status' => 'OK', 'message' => 'User registered correctly']);
    }
} catch (Exception $e) {
    response(['status' => 'ERROR', 'message' => $e->getMessage()]);
}

response([]);