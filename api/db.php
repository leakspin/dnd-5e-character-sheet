<?php

if (basename($_SERVER['PHP_SELF']) === basename(__FILE__)) {
    exit;
}

require_once 'config.php';

function registerUser($db, $user, $pass)
{
    if (getUserByName($db, $user)) {
        logMsg('ERROR', 'User already registered');
        throw new Exception("User already registered");

    }
    $stmt = $db->prepare('INSERT INTO user (user, pass) VALUES (:user, :pass)');
    $stmt->bindValue(':user', $user);
    $stmt->bindValue(':pass', password_hash($pass, PASSWORD_BCRYPT));
    if (!$stmt->execute()) {
        logMsg('ERROR', 'Error saving user: ' . implode(' | ', $stmt->errorInfo()));
        throw new Exception("Couldn't register user");
    }

    logMsg('INFO', 'User registered - ' . $user);
    return getUserByName($db, $user);
}

function getUser($db, $userId)
{
    $stmt = $db->prepare('SELECT * FROM user WHERE id = :userId');
    $stmt->bindValue(':userId', $userId);
    if ($stmt->execute()) {
        return $stmt->fetchAll();
    }
    throw new Exception('User not found.');
}

function getUserByName($db, $user)
{
    $stmt = $db->prepare('SELECT * FROM user WHERE user = :user');
    if (!$stmt) {
        logMsg('ERROR', 'Error preparing query: ' . implode(' | ', $db->errorInfo()));
        return "Error preparing query";
    }
    $stmt->bindValue(':user', $user);
    if ($stmt->execute()) {
        return $stmt->fetchAll();
    }
    throw new Exception('User not found.');
}

function changePassword($db, $userId, $oldPass, $newPass)
{
    $stmt = $db->prepare('SELECT * FROM user WHERE id = :userId');
    $stmt->bindValue(':userId', $userId);
    if ($stmt->execute()) {
        $user = $stmt->fetchAll();
        if (password_hash($oldPass, $user['pass'])) {
            $stmt = $db->prepare('UPDATE user set pass = :pass WHERE id = :userId');
            $stmt->bindValue(':userId', $userId);
            $stmt->bindValue(':pass', password_hash($pass, PASSWORD_BCRYPT));
            if (!$stmt->execute()) {
            } else {
                logMsg('INFO', 'Password changed for ' . $userId);
                return "Password changed correctly";
            }
        } else {
            logMsg('ERROR', "Password doesn't match for user " . $userId);
        }
    }

    logMsg('ERROR', 'Error saving user: ' . implode(' | ', $stmt->errorInfo()));
    throw new Exception("Couldn't change password");
}

function saveCharacter($db, $userId, $data, $characterId = null)
{
    if ($characterId) {
        $stmt = $db->prepare('UPDATE character SET data = :data, name = :name WHERE id = :characterId and user_id = :userId');
        $stmt->bindValue(':characterId', $characterId);
    } else {
        $stmt = $db->prepare('INSERT INTO character (user_id, name, data) VALUES (:userId, :name, :data)');
    }

    $stmt->bindValue(':userId', $userId);
    $stmt->bindValue(':name', $data['charname']);
    $stmt->bindValue(':data', json_encode($data));
    if (!$stmt->execute()) {
        logMsg('ERROR', 'Error saving character data: ' . implode(' | ', $stmt->errorInfo()));
        throw new Exception("Couldn't save character data");
    }

    return "Character saved";
}

function loadCharacter($db, $userId, $characterId)
{
    $stmt = $db->prepare('SELECT * FROM character WHERE user_id = :userId AND id = :characterId');
    $stmt->bindValue(':userId', $userId);
    $stmt->bindValue(':characterId', $characterId);
    if ($stmt->execute()) {
        return $stmt->fetchAll();
    }
    
    logMsg('ERROR', 'Error getting character data: ' . implode(' | ', $stmt->errorInfo()));
    throw new Exception("Couldn't get character data");
}