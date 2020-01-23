<?php

if (basename($_SERVER['PHP_SELF']) === basename(__FILE__)) {
    exit;
}

const DB_FILE = __DIR__ . '/db.db';
const LOG_FILE = __DIR__ . '/dnd.log';
const SECRET = 'Esto es una ficha de DnD';
const ALG_ENCRYPT = 'AES-256-CBC';
const LOG_LEVEL = ['ERROR'];

set_error_handler(function ($code, $message, $file, $line) {
    logMsg('ERROR', $message . '|' . $file . ':' . $line);
});

set_exception_handler(function ($exception) {
    logMsg('ERROR', $exception->getMessage() . '|' . $exception->getFile() . ':' . $exception->getLine());
});

function logMsg($status, $msg)
{
    if (in_array($status, LOG_LEVEL)) {
        file_put_contents(LOG_FILE, '[' . date('Y-m-d H:i:s') . '] [' . $status . '] - ' . $msg . PHP_EOL, FILE_APPEND);
    }
}

function sendResponse($data)
{
    echo json_encode($data);
    if (json_last_error()) {
        logMsg('ERROR', json_last_error_msg());
    }
    exit;
}

$created = file_exists(DB_FILE);

$db = new PDO(
    'sqlite:' . DB_FILE,
    null,
    null
);

if (!$created) {
    $db->query('CREATE TABLE user (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        user VARCHAR NOT NULL,
        pass VARCHAR NOT NULL
    );');
    logMsg('ERROR', 'Creating table user: ' . implode(' | ', $db->errorInfo()));
    $db->query('CREATE TABLE character (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name VARCHAR NOT NULL,
        data TEXT NOT NULL
    );');
    logMsg('ERROR', 'Creating table character: ' . implode(' | ', $db->errorInfo()));
}