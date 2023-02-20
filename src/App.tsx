import { ReactNode, useEffect, useRef, useState } from "react";
import { Button, Dialog, DialogContent, DialogTitle, IconButton, Link, List, ListItem, ListItemIcon, ListItemText, TextField } from "@mui/material";
import { Abc, AccessTime, Code, ContentCopy, Face, Fingerprint, Help, Key, ListAlt, LocalAtm, Pageview, Pin, PriceChange, Tag, Wallet } from '@mui/icons-material';
import { tx, wallet } from '@cityofzion/neon-core';
import { reverseHex, num2hexstring } from '@cityofzion/neon-core/lib/u';
import { MAGIC_NUMBER } from '@cityofzion/neon-core/lib/consts';

function Frame(props: { open?: boolean, children?: ReactNode }) {
  return <Dialog open={props.open ?? true} fullWidth>
    <DialogTitle>
      <Link href='/'>Neo Off Line</Link>
      <Link sx={{ position: 'absolute', right: 16 }} target='_blank' href='/doc'>
        <Help color='info' />
      </Link>
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

export default function App() {
  const [hash, HASH] = useState(window.location.hash);
  const [errmsg, ERRMSG] = useState('');
  const primary = useRef<HTMLInputElement>(null);
  useEffect(
    () => {
      const handler = () => HASH(window.location.hash);
      window.addEventListener('hashchange', handler);
      return () => window.removeEventListener('hashchange', handler);
    },
    [],
  );
  try {
    if (/^#?$/.test(hash)) {
      (window as any).ttt = MAGIC_NUMBER;
      return <Frame>
        <TextField autoFocus fullWidth variant='standard' placeholder='¡USE AT YOUR OWN RISK!' inputRef={primary} error={errmsg.length > 0} helperText={errmsg} label='TRANSACTION' onChange={() => ERRMSG('')} />
        <Button fullWidth onClick={() => { window.location.hash = `/req?net=${MAGIC_NUMBER.MainNet}&tx=${primary.current!.value}`; }}>
          <Pageview />
        </Button>
      </Frame>;
    }
    const url = new URL(hash.slice(1), window.location.href);
    switch (url.pathname) {
      case '/req':
        const [magic, transaction] = [parseInt(url.searchParams.get('net')!), tx.Transaction.deserialize(url.searchParams.get('tx')!)];
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
          <TextField autoFocus fullWidth variant='standard' placeholder='¡USE AT YOUR OWN RISK!' label='PRIVATE KEY' type='password' autoComplete='current-password' inputRef={primary} error={errmsg.length > 0} helperText={errmsg} onChange={() => ERRMSG('')} />
          <Button
            fullWidth
            onClick={() => {
              try {
                if (!wallet.isPrivateKey(primary.current!.value) && !wallet.isWIF(primary.current!.value)) throw new Error();
                const account = new wallet.Account(primary.current!.value);
                window.location.hash = `/sig?sig=${wallet.sign(`${num2hexstring(magic, 4, true)}${reverseHex(transaction.hash())}`, account.privateKey)}&addr=${account.address}&scripthash=${account.scriptHash}&pubkey=${account.publicKey}`;
              } catch (e) {
                ERRMSG('SIGN FAILED')
              }
            }}
          >
            <Fingerprint color='primary' />
          </Button>
        </Frame>;
      case '/sig':
        const [addr, scripthash, pubkey, sig] = ['addr', 'scripthash', 'pubkey', 'sig'].map(v => url.searchParams.get(v)!);
        return <Frame>
          <List dense>
            <Item icon={<Wallet color='info' />} value={addr} name='ADDRESS' />
            <Item icon={<Tag color='info' />} value={scripthash} name='SCRIPT HASH' />
            <Item icon={<Key color='info' />} value={pubkey} name='PUBLIC KEY' />
            <Item icon={<Fingerprint color='info' />} value={sig} name='SIGNATURE' />
          </List>
        </Frame>;
      default:
        throw new Error();
    }
  } catch {
    if (errmsg.length === 0) {
      ERRMSG('INVALID NEOOFFLINE PAYLOAD');
    }
    window.location.hash = '';
  }
  return <></>;
}
