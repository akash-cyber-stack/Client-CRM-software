import OtpVerification from './OtpVerification';

export default function EmailOtpVerification({ email, maskedEmail, devOtp: _devOtp, ...rest }) {
  return (
    <OtpVerification
      channel="email"
      destination={email}
      maskedDestination={maskedEmail}
      {...rest}
    />
  );
}
