'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Input,
  Textarea,
  Field,
  Text,
  Spinner,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { SendRegular, CheckmarkCircleRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  gridFull: {
    gridColumn: '1 / -1',
  },
  success: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '24px',
    textAlign: 'center',
  },
  successIcon: {
    color: tokens.colorPaletteGreenForeground1,
    fontSize: '64px',
  },
  telegramButton: {
    backgroundColor: '#0088cc',
    ':hover': {
      backgroundColor: '#006699',
    },
  },
});

interface AuditRequestDialogProps {
  trigger?: React.ReactElement;
  projectName?: string;
  symbol?: string;
  contractAddress?: string;
  blockchain?: string;
}

export default function AuditRequestDialog({
  trigger,
  projectName: initialProjectName = '',
  symbol: initialSymbol = '',
  contractAddress: initialContractAddress = '',
  blockchain: initialBlockchain = '',
}: AuditRequestDialogProps) {
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    projectName: initialProjectName,
    symbol: initialSymbol,
    contractAddress: initialContractAddress,
    blockchain: initialBlockchain,
    website: '',
    telegram: '',
    twitter: '',
    email: '',
    description: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/audit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Audit request error:', error);
      alert('Failed to submit audit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openTelegramBot = async () => {
    try {
      const params = new URLSearchParams({
        projectName: formData.projectName,
        symbol: formData.symbol,
        blockchain: formData.blockchain,
      });

      const response = await fetch(`/api/audit-request/telegram-link?${params}`);
      const data = await response.json();

      if (data.success) {
        window.open(data.telegramLink, '_blank');
      }
    } catch (error) {
      console.error('Telegram link error:', error);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({
      projectName: initialProjectName,
      symbol: initialSymbol,
      contractAddress: initialContractAddress,
      blockchain: initialBlockchain,
      website: '',
      telegram: '',
      twitter: '',
      email: '',
      description: '',
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        {trigger || (
          <Button appearance="primary" icon={<SendRegular />}>
            Request Audit
          </Button>
        )}
      </DialogTrigger>

      <DialogSurface>
        <DialogBody>
          <DialogTitle>Request Smart Contract Audit</DialogTitle>

          <DialogContent>
            {!submitted ? (
              <form className={styles.form}>
                <div className={styles.grid}>
                  <Field label="Project Name *" required>
                    <Input
                      value={formData.projectName}
                      onChange={(e) => handleChange('projectName', e.target.value)}
                      placeholder="Enter project name"
                    />
                  </Field>

                  <Field label="Symbol">
                    <Input
                      value={formData.symbol}
                      onChange={(e) => handleChange('symbol', e.target.value)}
                      placeholder="e.g., ETH"
                    />
                  </Field>
                </div>

                <div className={styles.grid}>
                  <Field label="Blockchain *" required>
                    <Input
                      value={formData.blockchain}
                      onChange={(e) => handleChange('blockchain', e.target.value)}
                      placeholder="e.g., Ethereum, BSC"
                    />
                  </Field>

                  <Field label="Contract Address">
                    <Input
                      value={formData.contractAddress}
                      onChange={(e) => handleChange('contractAddress', e.target.value)}
                      placeholder="0x..."
                    />
                  </Field>
                </div>

                <div className={styles.grid}>
                  <Field label="Website">
                    <Input
                      value={formData.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                      placeholder="https://"
                    />
                  </Field>

                  <Field label="Email">
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="contact@project.com"
                    />
                  </Field>
                </div>

                <div className={styles.grid}>
                  <Field label="Telegram">
                    <Input
                      value={formData.telegram}
                      onChange={(e) => handleChange('telegram', e.target.value)}
                      placeholder="https://t.me/..."
                    />
                  </Field>

                  <Field label="Twitter">
                    <Input
                      value={formData.twitter}
                      onChange={(e) => handleChange('twitter', e.target.value)}
                      placeholder="https://twitter.com/..."
                    />
                  </Field>
                </div>

                <Field label="Project Description" className={styles.gridFull}>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Brief description of your project and what you'd like audited..."
                    rows={4}
                  />
                </Field>

                <Text size={200} style={{ opacity: 0.7 }}>
                  * Required fields. We'll contact you via Telegram with a quote and timeline.
                </Text>
              </form>
            ) : (
              <div className={styles.success}>
                <CheckmarkCircleRegular className={styles.successIcon} />
                <Text size={500} weight="semibold">
                  Request Submitted!
                </Text>
                <Text>
                  Thank you for requesting an audit for <strong>{formData.projectName}</strong>.
                </Text>
                <Text>
                  We've received your request and will contact you shortly via Telegram.
                </Text>
                <Button
                  appearance="primary"
                  className={styles.telegramButton}
                  onClick={openTelegramBot}
                >
                  Open Telegram Bot
                </Button>
              </div>
            )}
          </DialogContent>

          <DialogActions>
            {!submitted ? (
              <>
                <DialogTrigger disableButtonEnhancement>
                  <Button appearance="secondary">Cancel</Button>
                </DialogTrigger>
                <Button
                  appearance="primary"
                  onClick={handleSubmit}
                  disabled={loading || !formData.projectName || !formData.blockchain}
                  icon={loading ? <Spinner size="tiny" /> : <SendRegular />}
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </Button>
              </>
            ) : (
              <Button appearance="primary" onClick={handleReset}>
                Close
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
