'use client';

import { useRef, useState, type FormEvent } from 'react';

import styles from './register.module.css';

type Field = 'email' | 'password' | 'confirm' | 'consent';
type FormValues = Record<Field, string | boolean>;
type Errors = Partial<Record<Field, string>>;
type Status = 'idle' | 'invalid' | 'demo-submitted';

const EMPTY_VALUES: FormValues = {
  email: '',
  password: '',
  confirm: '',
  consent: false,
};

const FIELD_ORDER: Field[] = ['email', 'password', 'confirm', 'consent'];

const CONSENT_TEXT =
  '我已知悉：本页仅作界面展示，不会创建真实账号，也不会提交、存储或传输填写的信息。';

function validate(values: FormValues): Errors {
  const errors: Errors = {};

  const email = String(values.email).trim();
  if (!email) {
    errors.email = '请填写邮箱。';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = '请输入有效的邮箱地址。';
  }

  const password = String(values.password);
  if (!password) {
    errors.password = '请填写密码。';
  } else if (
    password.length < 8 ||
    password.length > 64 ||
    !/[A-Za-z]/.test(password) ||
    !/\d/.test(password)
  ) {
    errors.password = '密码需为 8–64 位，且同时包含字母和数字。';
  }

  const confirm = String(values.confirm);
  if (!confirm) {
    errors.confirm = '请再次输入密码。';
  } else if (confirm !== password) {
    errors.confirm = '两次输入的密码不一致。';
  }

  if (values.consent !== true) {
    errors.consent = '请勾选知悉声明后再提交。';
  }

  return errors;
}

export default function RegisterPage() {
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const refs = useRef<Record<Field, HTMLInputElement | null>>({
    email: null,
    password: null,
    confirm: null,
    consent: null,
  });

  function update(field: Field, value: string | boolean): void {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus('invalid');
      const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field]);
      if (firstInvalid) refs.current[firstInvalid]?.focus();
      return;
    }
    setValues({ ...EMPTY_VALUES });
    setErrors({});
    setShowPassword(false);
    setShowConfirm(false);
    setStatus('demo-submitted');
  }

  return (
    <main className={styles.main} data-testid="register-page">
      <h1 id="register-heading" className={styles.title}>
        用户注册（界面演示）
      </h1>
      <p className={styles.intro}>
        本页仅作界面展示，不会创建真实账号，也不会提交、存储或传输您填写的信息。
      </p>

      <form
        className={styles.form}
        noValidate
        onSubmit={handleSubmit}
        aria-labelledby="register-heading"
      >
        {status === 'invalid' && (
          <div className={styles.summary} role="alert" tabIndex={-1}>
            <p className={styles.summaryTitle}>请检查以下内容：</p>
            <ul className={styles.summaryList}>
              {FIELD_ORDER.filter((field) => errors[field]).map((field) => (
                <li key={field}>{errors[field]}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="register-email">
            邮箱
          </label>
          <input
            id="register-email"
            className={styles.input}
            type="email"
            autoComplete="email"
            required
            value={String(values.email)}
            onChange={(event) => update('email', event.target.value)}
            ref={(node) => {
              refs.current.email = node;
            }}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'register-email-error' : undefined}
          />
          {errors.email && (
            <p id="register-email-error" className={styles.error}>
              {errors.email}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="register-password">
            密码
          </label>
          <div className={styles.inputRow}>
            {/* 默认 type="password"；切换仅在 password / text 之间改变可见性，不清空值。 */}
            <input
              id="register-password"
              className={styles.input}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={String(values.password)}
              onChange={(event) => update('password', event.target.value)}
              ref={(node) => {
                refs.current.password = node;
              }}
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? 'register-password-error' : undefined}
            />
            <button
              className={styles.toggle}
              type="button"
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? '隐藏' : '显示'}
            </button>
          </div>
          {errors.password && (
            <p id="register-password-error" className={styles.error}>
              {errors.password}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="register-confirm">
            确认密码
          </label>
          <div className={styles.inputRow}>
            {/* 默认 type="password"；切换仅在 password / text 之间改变可见性，不清空值。 */}
            <input
              id="register-confirm"
              className={styles.input}
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={String(values.confirm)}
              onChange={(event) => update('confirm', event.target.value)}
              ref={(node) => {
                refs.current.confirm = node;
              }}
              aria-invalid={errors.confirm ? true : undefined}
              aria-describedby={errors.confirm ? 'register-confirm-error' : undefined}
            />
            <button
              className={styles.toggle}
              type="button"
              aria-label={showConfirm ? '隐藏确认密码' : '显示确认密码'}
              aria-pressed={showConfirm}
              onClick={() => setShowConfirm((current) => !current)}
            >
              {showConfirm ? '隐藏' : '显示'}
            </button>
          </div>
          {errors.confirm && (
            <p id="register-confirm-error" className={styles.error}>
              {errors.confirm}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="register-consent">
            知悉声明
          </label>
          <div className={styles.consentRow}>
            <input
              id="register-consent"
              className={styles.checkbox}
              type="checkbox"
              required
              checked={values.consent === true}
              onChange={(event) => update('consent', event.target.checked)}
              ref={(node) => {
                refs.current.consent = node;
              }}
              aria-invalid={errors.consent ? true : undefined}
              aria-describedby={errors.consent ? 'register-consent-error' : undefined}
            />
            <span className={styles.consentText}>{CONSENT_TEXT}</span>
          </div>
          {errors.consent && (
            <p id="register-consent-error" className={styles.error}>
              {errors.consent}
            </p>
          )}
        </div>

        <button className={styles.submit} type="submit">
          提交（界面演示）
        </button>

        {status === 'demo-submitted' && (
          <p className={styles.notice} role="status">
            未创建真实账号，未提交或存储任何信息。
          </p>
        )}
      </form>
    </main>
  );
}
