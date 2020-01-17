<?php

if (basename($_SERVER['PHP_SELF']) === basename(__FILE__)) {
    exit;
}

const DB_FILE = __DIR__ . '/db.db';
const LOG_FILE = __DIR__ . '/dnd.log';
const SECRET = 'Esto es una ficha de DnD';
const ALG_ENCRYPT = 'AES-256-CBC';

$created = file_exists(DB_FILE);

$db = new PDO(
    'sqlite:' . DB_FILE,
    null,
    null
);

if (!$created) {
    $db->query('CREATE TABLE user (
        id int(11) NOT NULL PRIMARY KEY AUTOINCREMENT,
        user varchar(150) NOT NULL,
        pass varchar(60) NOT NULL
    ) WITHOUT ROWID;');
    $db->query('CREATE TABLE character (
        id int(11) NOT NULL PRIMARY KEY,
        user_id int(11) NOT NULL,
        name varchar(255) NOT NULL,
        data TEXT NOT NULL
    ) WITHOUT ROWID;');
}

function logMsg($status, $msg)
{
    file_put_contents(LOG_FILE, '[' . date('Y-m-d H:i:s') . '] [' . $status . '] - ' . $msg . PHP_EOL, FILE_APPEND);
}

function response($data)
{
    echo json_encode($data);
    exit;
}