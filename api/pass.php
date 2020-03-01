<?php

(PHP_SAPI !== 'cli' || isset($_SERVER['HTTP_USER_AGENT'])) && die('cli only');

require_once 'config.php';

function changePassword($db, $userId, $newPass)
{
    $stmt = $db->prepare('SELECT * FROM user WHERE id = :userId');
    $stmt->bindValue(':userId', $userId);
    if ($stmt->execute()) {
        $user = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $stmt = $db->prepare('UPDATE user set pass = :pass WHERE id = :userId');
            $stmt->bindValue(':userId', $userId);
            $stmt->bindValue(':pass', password_hash($newPass, PASSWORD_BCRYPT));
            if ($stmt->execute()) {
                logMsg('INFO', 'Password changed for ' . $userId);
                return "Password changed correctly";
            }
    }

    logMsg('ERROR', 'Error saving user: ' . implode(' | ', $stmt->errorInfo()));
    throw new Exception("Couldn't change password");
}

echo "Nope";
die;
changePassword($db, $argv[1], $argv[2]);
