import { ReactNode, useEffect, useRef, useState } from "react";
import { Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Link, List, ListItem, ListItemIcon, ListItemText, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { Abc, AccessTime, Code, ContentCopy, Face, Fingerprint, Help, Key, ListAlt, LocalAtm, Password, Pin, PlayArrow, PriceChange, Publish, Share, Tag, Wallet } from '@mui/icons-material';
import { tx, wallet } from '@cityofzion/neon-core';
import { reverseHex, num2hexstring, ab2hexstring } from '@cityofzion/neon-core/lib/u';
function Frame(props: { open?: boolean, children?: ReactNode }) {
  return <Dialog open={props.open ?? true} fullWidth>
    <DialogTitle display='flex'>
      <Link href='/' flexGrow={1}>Neo Off Line</Link>
      <IconButton onClick={() => { window.navigator.share({ url: window.location.href }) }}>
        <Share color='primary' />
      </IconButton>
      <IconButton onClick={() => { window.location.hash = `/document`; }}>
        <Help color='info' />
      </IconButton>
    </DialogTitle>
    <DialogContent>{props.children}</DialogContent>
  </Dialog>;
}
function Item(props: { icon: ReactNode, value: string, name: string }) {
  return <ListItem dense secondaryAction={<IconButton edge='end' onClick={() => { navigator.clipboard.writeText(props.value) }}><ContentCopy color='primary' /></IconButton>}>
    <ListItemIcon>{props.icon}</ListItemIcon>
    <ListItemText primary={props.value} secondary={props.name} primaryTypographyProps={{ fontFamily: 'monospace', overflow: 'auto', textOverflow: 'clip', noWrap: true }} secondaryTypographyProps={{ fontFamily: 'monospace' }} />
  </ListItem>;
}
function PageSign(props: { url: URL }) {
  const [kp, KP] = useState(true);
  const [err, ERR] = useState('');
  const primary = useRef<HTMLInputElement>(null);
  const [magic, transaction] = [parseInt(props.url.searchParams.get('magic')!), tx.Transaction.deserialize(props.url.searchParams.get('transaction')!)];
  return <Frame>
    <List dense>
      <Item icon={<Abc color='info' />} value={`0x${magic}`} name='NETWORK MAGIC' />
      <Item icon={<Tag color='info' />} value={`${transaction.version}`} name='VERSION' />
      <Item icon={<Pin color='info' />} value={`${transaction.nonce}`} name='NONCE' />
      <Item icon={<LocalAtm color='info' />} value={`${transaction.systemFee.toDecimal(8)}`} name='SYSTEM FEE' />
      <Item icon={<PriceChange color='info' />} value={`${transaction.networkFee.toDecimal(8)}`} name='NETWORK FEE' />
      <Item icon={<AccessTime color='primary' />} value={`${transaction.validUntilBlock}`} name='VALID UNTIL BLOCK' />
      <Item icon={<Face color='primary' />} value={`${transaction.signers.map(v => JSON.stringify(v.export()))}`} name='SIGNERS' />
      <Item icon={<ListAlt color='primary' />} value={`${transaction.attributes.map(v => JSON.stringify(v.export()))}`} name='ATTRIBUTES' />
      <Item icon={<Code color='primary' />} value={`${transaction.script}`} name='SCRIPT' />
    </List>
    <ToggleButtonGroup fullWidth exclusive value={kp} onChange={(...[, val]) => KP(val)}>
      <ToggleButton value={false}>
        <Key color={kp ? 'disabled' : 'primary'} />
      </ToggleButton>
      <ToggleButton value={true}>
        <Password color={kp ? 'primary' : 'disabled'} />
      </ToggleButton>
    </ToggleButtonGroup>
    <TextField autoFocus fullWidth variant='standard' placeholder='¡USE AT YOUR OWN RISK!' label={kp ? 'PASSWORD' : 'PRIVATE KEY'} type='password' autoComplete='current-password' inputRef={primary} error={err.length > 0} helperText={err} onChange={() => ERR('')} />
    <Button
      fullWidth
      onClick={() => {
        try {
          if (kp) {
            crypto.subtle.digest('SHA-256', new TextEncoder().encode(primary.current!.value)).then(ab => {
              const account = new wallet.Account(ab2hexstring(ab));
              window.location.hash = `/signature?signature=${wallet.sign(`${num2hexstring(magic, 4, true)}${reverseHex(transaction.hash())}`, account.privateKey)}&address=${account.address}&scripthash=${account.scriptHash}&publickey=${account.publicKey}`;
            })
          } else {
            if (!wallet.isPrivateKey(primary.current!.value) && !wallet.isWIF(primary.current!.value)) throw new Error();
            const account = new wallet.Account(primary.current!.value);
            window.location.hash = `/signature?signature=${wallet.sign(`${num2hexstring(magic, 4, true)}${reverseHex(transaction.hash())}`, account.privateKey)}&address=${account.address}&scripthash=${account.scriptHash}&publickey=${account.publicKey}`;
          }
        } catch (e) {
          ERR('SIGN FAILED')
        }
      }}
    >
      <Fingerprint color='primary' />
    </Button>
  </Frame>;
}
function PageSignature(props: { url: URL }) {
  const [address, scripthash, publickey, signature] = ['address', 'scripthash', 'publickey', 'signature'].map(v => props.url.searchParams.get(v)!);
  return <Frame>
    <List dense>
      <Item icon={<Wallet color='info' />} value={address} name='ADDRESS' />
      <Item icon={<Tag color='info' />} value={scripthash} name='SCRIPT HASH' />
      <Item icon={<Key color='info' />} value={publickey} name='PUBLIC KEY' />
      <Item icon={<Fingerprint color='info' />} value={signature} name='SIGNATURE' />
    </List>
  </Frame>;
}
function PageSecret(props: { url: URL }) {
  const primary = useRef<HTMLInputElement>(null);
  const [sk, SK] = useState('');
  const account = wallet.isWIF(sk) || wallet.isPrivateKey(sk) ? new wallet.Account(sk) : undefined;
  return <Frame>
    <List dense>
      <Item icon={<Wallet color='info' />} value={account?.address ?? 'INVALID'} name='ADDRESS' />
      <Item icon={<Tag color='info' />} value={`0x${account?.scriptHash ?? 'INVALID'}`} name='SCRIPT HASH' />
      <Item icon={<Key color='info' />} value={account?.publicKey ?? 'INVALID'} name='PUBLIC KEY' />
    </List>
    <Typography textAlign='center' fontWeight={1000}>BACKUP YOUR KEY IN PASSWORD MANAGER</Typography>
    <Box display='flex'>
      <Box flexGrow={1}>
        <TextField autoFocus fullWidth variant='standard' placeholder='¡USE AT YOUR OWN RISK!' label='PRIVATE KEY' type='password' autoComplete='current-password' inputRef={primary} value={sk} onChange={ev => SK(ev.target.value)} />
      </Box>
      <IconButton onClick={() => {
        window.location.reload();
      }}>
        <Publish color='primary' />
      </IconButton>
    </Box>
  </Frame>;
}
function PageHome(props: { url: URL }) {
  const primary = useRef<HTMLInputElement>(null);
  return <Frame>
    <TextField autoFocus fullWidth variant='standard' placeholder='¡USE AT YOUR OWN RISK!' inputRef={primary} error={props.url.searchParams.get('msg') !== null} helperText={props.url.searchParams.get('msg')} label='NEO OFF LINE LINK' />
    <Button
      fullWidth
      onClick={() => {
        const val = new URL(primary.current!.value, window.location.href).hash;
        window.location.hash = val ? val : primary.current!.value;
      }}
    >
      <PlayArrow color='primary' />
    </Button>
  </Frame>;
}
export default function App() {
  const [hash, HASH] = useState(window.location.hash);
  useEffect(
    () => {
      const handler = () => HASH(window.location.hash);
      window.addEventListener('hashchange', handler);
      return () => window.removeEventListener('hashchange', handler);
    },
    [],
  );
  try {
    const url = new URL(hash.slice(1), window.location.href);
    switch (url.pathname) {
      case '/':
        return <PageHome url={url} />;
      case '/sign':
        return <PageSign url={url} />
      case '/signature':
        return <PageSignature url={url} />
      case '/secret':
        return <PageSecret url={url} />;
      case '/document':
        return <Frame>
          TODO
        </Frame>;
      default:
        throw new Error();
    }
  } catch {
    window.location.hash = '#/?msg=INVALIDNEOOFFLINELINK';
  }
  return <></>;
}
