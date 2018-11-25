import t from "tcomb";

let Asset = t.struct({
    bitasset_data_id: t.maybe(t.Str),
    bitasset_data: t.maybe(t.Obj),
    dynamic_asset_data_id: t.Str,
    dynamic_data: t.maybe(t.Obj),
    id: t.Str,
    issuer: t.Str,
    market_asset: t.Bool,
    options: t.Obj,
    precision: t.Num,
    symbol: t.Str
}, "Asset");

let Block = t.struct({
    extensions: t.Arr,
    id: t.Num,
    previous: t.Str,
    timestamp: t.Dat,
    transactions: t.Arr,
    transaction_merkle_root: t.Str,
    witness: t.Str,
    witness_signature: t.Str
}, "Block");

let WalletTcomb = t.struct({
    public_name: t.Str,
    yoyow_id: t.Str,
    created: t.Dat,
    last_modified: t.Dat,
    backup_date: t.maybe(t.Dat),
    password_pubkey: t.Str,             //用于校验密码
    password_short_pubkey: t.Str,      //用于校验短密码
    encryption_key: t.Str,              //用构造aes_private
    encryption_short_key: t.Str,        //用于构造aes_short_private
    encrypted_active: t.Obj,
    encrypted_secondary: t.Obj,
    encrypted_memo: t.Obj,
    chain_id: t.Str
}, "WalletTcomb");

let PrivateKeyTcomb = t.struct({
    id: t.maybe(t.Num),
    label: t.maybe(t.Str),
    pubkey: t.Str,
    encrypted_key: t.Str,
    encrypted_short_key: t.maybe(t.Str)
}, "PrivateKeyTcomb");

export {Asset, Block, WalletTcomb, PrivateKeyTcomb};