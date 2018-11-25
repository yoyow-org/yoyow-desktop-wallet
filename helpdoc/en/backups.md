# Backup and Recovery
Under the YOYOW account system, there are two main types of backup—private key backup and wallet backup. To avoid losses, we strongly advise you to read the content of this section carefully and back up your private key and wallet.

## Private Key Backup
- After successful registration, the system will return to you a private key for your account. The private key is for the owner authorization within your account authorization.
- The private key will appear only ONCE. The system will not store it for you, neither will it be stored in your browser. Therefore, you must manually back it up.


## Wallet Backup
- Under “Setup”—“Backup”, the system will generate a backup file with the .bin file extension. The backup file is encrypted using your account password, and can be used to recover your account, or migrate your account on different browsers or computers
- The backup file does not contain the owner authorization private key for the account


## Recovering an Account with a Private Key
- The principle of this method is: to use the owner authorization private key to generate a key pair for other authorization levels
- This method will require you to enter a new wallet password for the encryption of new key pairs
- Necessary parameters: owner authorization private key for the account and new account password
- This action requires broadcasting to the blockchain and a fee will be charged


## Recovering an Account with a Backup File
- The principle of this method is: to provide a backed-up wallet password for the decryption of backup files
- Necessary parameters: the account’s backup files (.bin format) and the original account password
