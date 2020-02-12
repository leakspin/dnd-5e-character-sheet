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
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    throw new Exception('User not found.');
}

function getUserByName($db, $user)
{
    $stmt = $db->prepare('SELECT * FROM user WHERE user = :user');
    $stmt->bindValue(':user', $user);
    if ($stmt->execute()) {
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    throw new Exception('User not found.');
}

function changePassword($db, $userId, $oldPass, $newPass)
{
    $stmt = $db->prepare('SELECT * FROM user WHERE id = :userId');
    $stmt->bindValue(':userId', $userId);
    if ($stmt->execute()) {
        $user = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if (password_hash($oldPass, $user['pass'])) {
            $stmt = $db->prepare('UPDATE user set pass = :pass WHERE id = :userId');
            $stmt->bindValue(':userId', $userId);
            $stmt->bindValue(':pass', password_hash($pass, PASSWORD_BCRYPT));
            if ($stmt->execute()) {
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

function getCharacters($db, $userId)
{
    $stmt = $db->prepare('SELECT id, name FROM character WHERE user_id = :userId');
    $stmt->bindValue(':userId', $userId);
    if (!$stmt->execute()) {
        logMsg('ERROR', 'Error getting characters for user ' . $userId . ': ' . implode(' | ', $stmt->errorInfo()));
        throw new Exception("Couldn't get characters.");
    }

    logMsg('INFO', 'Characters retrieved correctly for user ' . $userId);

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getCharacter($db, $userId, $characterId)
{
    $stmt = $db->prepare('SELECT * FROM character WHERE user_id = :userId and id = :characterId');
    $stmt->bindValue(':userId', $userId);
    $stmt->bindValue(':characterId', $characterId);
    if (!$stmt->execute()) {
        logMsg('ERROR', 'Error getting character ' . $characterId . ': ' . implode(' | ', $stmt->errorInfo()));
        throw new Exception("Couldn't get character");
    }

    logMsg('INFO', 'Character ' . $characterId . ' retrieved correctly for user ' . $userId);

    return $stmt->fetch(PDO::FETCH_ASSOC);
}

function saveCharacter($db, $userId, $data, $characterId = null, $lastSavedDate = null, $force = false)
{
    if ($characterId) {
        $char = getCharacter($db, $userId, $characterId);
        if (!$force && strtotime($char['datetime']) > strtotime($lastSavedDate)) {
            logMsg('INFO', 'Character ' . $characterId . ' already saved with a future date.');
            throw new Exception("Character already saved with a future date, must overwrite.");
        }

        $stmt = $db->prepare('UPDATE character SET data = :data, name = :name, datetime = :datetime WHERE id = :characterId and user_id = :userId');
        $stmt->bindValue(':characterId', $characterId);
    } else {
        $stmt = $db->prepare('INSERT INTO character (user_id, name, data, datetime) VALUES (:userId, :name, :data, :datetime)');
    }

    $stmt->bindValue(':userId', $userId);
    $stmt->bindValue(':name', $data['charname']);
    $stmt->bindValue(':data', json_encode($data));
    $stmt->bindValue(':datetime', date('Y-m-d H:i:s'));
    if (!$stmt->execute()) {
        logMsg('ERROR', 'Error saving character data for user ' . $userId . ': ' . implode(' | ', $stmt->errorInfo()));
        throw new Exception("Couldn't save character data");
    }

    if (!$characterId) {
        $characterId = $db->lastInsertId();
    }

    logMsg('INFO', 'Character ' . $characterId . ' saved correctly for user ' . $userId);
    return ['message' => 'Character saved', 'data' => getCharacter($db, $userId, $characterId)];
}

function loadCharacter($db, $userId, $characterId)
{
    $stmt = $db->prepare('SELECT * FROM character WHERE user_id = :userId AND id = :characterId');
    $stmt->bindValue(':userId', $userId);
    $stmt->bindValue(':characterId', $characterId);
    if ($stmt->execute()) {
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    logMsg('ERROR', 'Error getting character ' . $characterId . ' for user ' . $userId . ' data: ' . implode(' | ', $stmt->errorInfo()));
    throw new Exception("Couldn't get character data");
}

function deleteCharacter($db, $userId, $characterId)
{
    $stmt = $db->prepare('SELECT id FROM character WHERE user_id = :userId AND id = :characterId');
    $stmt->bindValue(':userId', $userId);
    $stmt->bindValue(':characterId', $characterId);
    if ($stmt->execute()) {
        $stmt = $db->prepare('DELETE FROM character WHERE user_id = :userId AND id = :characterId');
        $stmt->bindValue(':userId', $userId);
        $stmt->bindValue(':characterId', $characterId);

        if (!$stmt->execute()) {
            logMsg('ERROR', 'Error while deleting character ' . $characterId . ' for user ' . $userId . ': ' . implode(' | ', $stmt->errorInfo()));
            throw new Exception("Error while deleting character");
        } else {
            logMsg('INFO', 'Character ' . $characterId . ' removed correctly.');
            return 'Character removed successfully';
        }
    }
    
    logMsg('ERROR', 'Error getting character ' . $characterId . ' data for user ' . $userId . ': ' . implode(' | ', $stmt->errorInfo()));
    throw new Exception("Couldn't get character data");
}