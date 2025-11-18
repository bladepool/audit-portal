'use client';

import { useState } from 'react';
import {
  Card,
  Input,
  Textarea,
  Button,
  Text,
  Field,
  Dropdown,
  Option,
  makeStyles,
} from '@fluentui/react-components';
import { Add24Regular, Delete24Regular } from '@fluentui/react-icons';
import { Finding } from '@/lib/types';

const useStyles = makeStyles({
  findingCard: {
    padding: '16px',
    marginBottom: '12px',
    borderLeft: '4px solid #0078d4',
  },
  findingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  gridFull: {
    gridColumn: '1 / -1',
  },
  addButton: {
    marginTop: '12px',
  },
});

interface FindingsManagerProps {
  findings: Finding[];
  onChange: (findings: Finding[]) => void;
}

const SEVERITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low', 'Informational'];
const STATUS_OPTIONS = ['Detected', 'Not Detected', 'Pass', 'Fail', 'Acknowledge'];
const CATEGORY_OPTIONS = [
  'Security',
  'Centralization',
  'Validation',
  'Optimization',
  'Gas Savings',
  'Code Quality',
  'Best Practice',
  'Logging',
  'Dependencies',
  'Distribution',
  'Functionality',
  'Coding Style',
  'Trading',
  'Ownership',
  'Access Control',
  'Initialization',
  'Business Logic',
  'Naming',
  'Input Validation',
  'Gas Usage',
];

// CFG templates based on data.json
const CFG_TEMPLATES: Record<string, Partial<Finding>> = {
  CFG01: {
    id: 'CFG01',
    title: 'Potential Sandwich Attacks',
    severity: 'Medium',
    category: 'Security',
    description: 'A sandwich attack might happen when an attacker observes a transaction swapping tokens or adding liquidity without setting restrictions on slippage or minimum output amount.',
    recommendation: 'We recommend setting reasonable minimum output amounts, instead of 0, based on token prices when calling the aforementioned functions.',
  },
  CFG02: {
    id: 'CFG02',
    title: 'Function Visibility Optimization',
    severity: 'Informational',
    category: 'Optimization',
    description: 'The following functions are declared as public and are not invoked in any of the contracts contained within the projects scope.',
    recommendation: 'We advise that the function\'s visibility specifiers are set to external, and the array-based arguments change their data location from memory to calldata, optimizing the gas cost of the function.',
  },
  CFG03: {
    id: 'CFG03',
    title: 'Lack of Input Validation',
    severity: 'Low',
    category: 'Validation',
    description: 'The given input is missing the check for the non-zero address.',
    recommendation: 'We advise the client to add the check for the passed-in values to prevent unexpected errors. Example: require(receiver != address(0), \'Receiver is the zero address\');',
  },
  CFG04: {
    id: 'CFG04',
    title: 'Centralized Risk In addLiquidity',
    severity: 'High',
    category: 'Centralization',
    description: 'The addLiquidity function calls the uniswapV2Router.addLiquidityETH function with the to address specified as owner() for acquiring the generated LP tokens.',
    recommendation: 'We advise the to address to be replaced by the contract itself, i.e. address(this), and to restrict the management of the LP tokens within the scope of the contract\'s business logic.',
  },
  CFG05: {
    id: 'CFG05',
    title: 'Missing Event Emission',
    severity: 'Low',
    category: 'Logging',
    description: 'Detected missing events for critical arithmetic parameters. There are functions that have no event emitted, so it is difficult to track off-chain changes.',
    recommendation: 'Emit an event for critical parameter changes. It is recommended emitting events for the sensitive functions that are controlled by centralization roles.',
  },
  CFG06: {
    id: 'CFG06',
    title: 'Conformance with Solidity Naming Conventions',
    severity: 'Low',
    category: 'Coding Style',
    description: 'Solidity defines a naming convention that should be followed. Rule exceptions: Allow constant variable name/symbol/decimals to be lowercase.',
    recommendation: 'Follow the Solidity naming convention.',
  },
  CFG07: {
    id: 'CFG07',
    title: 'State Variables could be Declared Constant',
    severity: 'Low',
    category: 'Gas Savings',
    description: 'Constant state variables should be declared constant to save gas.',
    recommendation: 'Add the constant attribute to state variables that never changes.',
  },
  CFG08: {
    id: 'CFG08',
    title: 'Dead Code Elimination',
    severity: 'Low',
    category: 'Code Quality',
    description: 'Functions that are not used in the contract, and make the code size bigger.',
    recommendation: 'Remove unused functions. Dead-code elimination can shrink program size and reduce running time.',
  },
  CFG09: {
    id: 'CFG09',
    title: 'Third Party Dependencies',
    severity: 'High',
    category: 'Dependencies',
    description: 'The contract is serving as the underlying entity to interact with third party protocols.',
    recommendation: 'We encourage the team to constantly monitor the statuses of 3rd parties to mitigate the side effects when unexpected activities are observed.',
  },
  CFG10: {
    id: 'CFG10',
    title: 'Initial Token Distribution',
    severity: 'High',
    category: 'Distribution',
    description: 'All tokens are sent to the contract deployer when deploying the contract. This could be a centralization risk.',
    recommendation: 'We recommend the team to be transparent regarding the initial token distribution process.',
  },
  CFG11: {
    id: 'CFG11',
    title: 'Custom Finding',
    severity: 'High',
    category: 'Functionality',
    description: 'Custom test case - anything noticed out of the normal can be flagged here.',
    recommendation: 'Review and address the custom finding.',
  },
  CFG12: {
    id: 'CFG12',
    title: 'Centralization Risks In Role or Function',
    severity: 'High',
    category: 'Centralization',
    description: 'The role has authority over critical functions. Any compromise may allow the hacker to take advantage of this authority.',
    recommendation: 'Carefully manage the privileged account\'s private key. Consider using multisignature wallets.',
  },
  CFG13: {
    id: 'CFG13',
    title: 'Extra Gas Cost For User',
    severity: 'Informational',
    category: 'Gas Usage',
    description: 'The user may trigger a tax distribution during the transfer process, which will cost a lot of gas.',
    recommendation: 'We advise the client to make the owner responsible for the gas costs of the tax distribution.',
  },
  CFG14: {
    id: 'CFG14',
    title: 'Unnecessary Use Of SafeMath',
    severity: 'Medium',
    category: 'Best Practice',
    description: 'The SafeMath library is used unnecessarily. With Solidity compiler versions 0.8.0 or newer, arithmetic operations automatically revert on overflow.',
    recommendation: 'Remove the usage of SafeMath library and use the built-in arithmetic operations.',
  },
  CFG15: {
    id: 'CFG15',
    title: 'Symbol Length Limitation',
    severity: 'High',
    category: 'Naming',
    description: 'The symbol used in the contract is too long, which can create issues for most Dapps.',
    recommendation: 'Limit the symbol to industry standard naming (3-7 characters).',
  },
  CFG16: {
    id: 'CFG16',
    title: 'Taxes can be up to 100%',
    severity: 'Critical',
    category: 'Critical',
    description: 'The current definition of taxes can be set up to 100% for specific wallets.',
    recommendation: 'Modify the function to not be dynamic but to be a static resolution.',
  },
  CFG17: {
    id: 'CFG17',
    title: 'Highly Permissive Role Access',
    severity: 'High',
    category: 'Access Control',
    description: 'The owner may manipulate the funds of accounts which do not belong to it.',
    recommendation: 'Remove the functionality or provide documentation with its description.',
  },
  CFG18: {
    id: 'CFG18',
    title: 'Stop Transactions by using Enable Trade',
    severity: 'Critical',
    category: 'Trading',
    description: 'Enable Trade combined with Exclude from fees can be considered a whitelist process.',
    recommendation: 'Carefully review this function and avoid problems when performing both actions.',
  },
  CFG19: {
    id: 'CFG19',
    title: 'Centralization Privileges of onlyOwner',
    severity: 'Medium',
    category: 'Ownership',
    description: 'Centralized Privileges are found on the following functions.',
    recommendation: 'Inheriting from Ownable ensures proper owner registration. Consider using timelock or multisig.',
  },
  CFG20: {
    id: 'CFG20',
    title: 'Centralization Risk in Launch Mechanism',
    severity: 'Critical',
    category: 'Centralization',
    description: 'The launch mechanism is controlled by a single owner address without any timelock or multisig protection.',
    recommendation: 'Implement a timelock mechanism for launch-related functions and consider using a multisig wallet.',
  },
  CFG21: {
    id: 'CFG21',
    title: 'Missing Access Control Recovery',
    severity: 'High',
    category: 'Access Control',
    description: 'No mechanism exists to recover from a compromised or lost owner account.',
    recommendation: 'Implement a secure ownership transfer mechanism with timelock and recovery options.',
  },
  CFG22: {
    id: 'CFG22',
    title: 'Anti-Manipulation Protection',
    severity: 'High',
    category: 'Security',
    description: 'The contract needs proper protection against manipulation attacks.',
    recommendation: 'Implement anti-manipulation measures.',
  },
  CFG23: {
    id: 'CFG23',
    title: 'Event Emission Coverage',
    severity: 'Low',
    category: 'Logging',
    description: 'Events should be properly emitted for critical state changes.',
    recommendation: 'Ensure all critical state changes emit events.',
  },
  CFG24: {
    id: 'CFG24',
    title: 'Missing Input Validation',
    severity: 'Low',
    category: 'Input Validation',
    description: 'Functions don\'t validate for zero address input.',
    recommendation: 'Add zero address validation in critical functions.',
  },
  CFG25: {
    id: 'CFG25',
    title: 'State Initialization Security',
    severity: 'Low',
    category: 'Initialization',
    description: 'Constructor should properly initialize state variables.',
    recommendation: 'Review constructor initialization.',
  },
  CFG26: {
    id: 'CFG26',
    title: 'Admin Functionality Toggle',
    severity: 'Informational',
    category: 'Business Logic',
    description: 'Admin functionality toggle behavior.',
    recommendation: 'Document admin toggle behavior clearly.',
  },
};

export default function FindingsManager({ findings, onChange }: FindingsManagerProps) {
  const styles = useStyles();

  const addFinding = () => {
    const newFinding: Finding = {
      id: `CFG${String(findings.length + 1).padStart(2, '0')}`,
      title: '',
      severity: 'Medium',
      status: 'Not Detected',
      category: 'Security',
      description: '',
      location: '',
      recommendation: '',
      alleviation: '',
      action: '',
      score: 0,
    };
    onChange([...findings, newFinding]);
  };

  const addFromTemplate = (cfgId: string) => {
    const template = CFG_TEMPLATES[cfgId];
    if (!template) return;

    const newFinding: Finding = {
      id: cfgId,
      title: template.title || '',
      severity: template.severity || 'Medium',
      status: 'Not Detected',
      category: template.category || 'Security',
      description: template.description || '',
      location: '',
      recommendation: template.recommendation || '',
      alleviation: '',
      action: '',
      score: 0,
    };
    onChange([...findings, newFinding]);
  };

  const updateFinding = (index: number, field: keyof Finding, value: any) => {
    const updated = [...findings];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const deleteFinding = (index: number) => {
    const updated = findings.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Text weight="semibold" size={500}>CFG Findings (CFG01-CFG26)</Text>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Dropdown
            placeholder="Add from template"
            onOptionSelect={(_, data) => {
              if (data.optionValue) {
                addFromTemplate(data.optionValue);
              }
            }}
          >
            {Object.keys(CFG_TEMPLATES).map((cfgId) => (
              <Option key={cfgId} value={cfgId} text={`${cfgId} - ${CFG_TEMPLATES[cfgId].title}`}>
                {cfgId} - {CFG_TEMPLATES[cfgId].title}
              </Option>
            ))}
          </Dropdown>
          <Button icon={<Add24Regular />} onClick={addFinding}>
            Add Custom Finding
          </Button>
        </div>
      </div>

      {findings.map((finding, index) => (
        <Card key={index} className={styles.findingCard}>
          <div className={styles.findingHeader}>
            <Text weight="semibold">{finding.id || `Finding ${index + 1}`}</Text>
            <Button
              icon={<Delete24Regular />}
              appearance="subtle"
              onClick={() => deleteFinding(index)}
            />
          </div>

          <div className={styles.grid}>
            <Field label="ID">
              <Input
                value={finding.id}
                onChange={(e) => updateFinding(index, 'id', e.target.value)}
              />
            </Field>

            <Field label="Severity *">
              <Dropdown
                value={finding.severity}
                selectedOptions={[finding.severity]}
                onOptionSelect={(_, data) => updateFinding(index, 'severity', data.optionValue)}
              >
                {SEVERITY_OPTIONS.map((opt) => (
                  <Option key={opt} value={opt}>{opt}</Option>
                ))}
              </Dropdown>
            </Field>

            <Field label="Status *">
              <Dropdown
                value={finding.status}
                selectedOptions={[finding.status]}
                onOptionSelect={(_, data) => updateFinding(index, 'status', data.optionValue)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <Option key={opt} value={opt}>{opt}</Option>
                ))}
              </Dropdown>
            </Field>

            <Field label="Category">
              <Dropdown
                value={finding.category}
                selectedOptions={[finding.category]}
                onOptionSelect={(_, data) => updateFinding(index, 'category', data.optionValue)}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <Option key={opt} value={opt}>{opt}</Option>
                ))}
              </Dropdown>
            </Field>

            <Field label="Title *" className={styles.gridFull}>
              <Input
                value={finding.title}
                onChange={(e) => updateFinding(index, 'title', e.target.value)}
              />
            </Field>

            <Field label="Location (L:line C:column)" className={styles.gridFull}>
              <Input
                value={finding.location}
                onChange={(e) => updateFinding(index, 'location', e.target.value)}
                placeholder="L: 123 C: 45"
              />
            </Field>

            <Field label="Description *" className={styles.gridFull}>
              <Textarea
                value={finding.description}
                onChange={(e) => updateFinding(index, 'description', e.target.value)}
                rows={3}
              />
            </Field>

            <Field label="Recommendation *" className={styles.gridFull}>
              <Textarea
                value={finding.recommendation}
                onChange={(e) => updateFinding(index, 'recommendation', e.target.value)}
                rows={3}
              />
            </Field>

            <Field label="Alleviation" className={styles.gridFull}>
              <Textarea
                value={finding.alleviation}
                onChange={(e) => updateFinding(index, 'alleviation', e.target.value)}
                rows={2}
              />
            </Field>

            <Field label="Action">
              <Input
                value={finding.action}
                onChange={(e) => updateFinding(index, 'action', e.target.value)}
              />
            </Field>

            <Field label="Score">
              <Input
                type="number"
                value={finding.score.toString()}
                onChange={(e) => updateFinding(index, 'score', parseInt(e.target.value) || 0)}
              />
            </Field>
          </div>
        </Card>
      ))}

      {findings.length === 0 && (
        <Text style={{ textAlign: 'center', padding: '24px', color: '#666' }}>
          No findings added yet. Add findings from templates or create custom ones.
        </Text>
      )}
    </div>
  );
}
