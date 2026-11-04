import settings from '../data/settings.json';

const s = settings as typeof settings & { formAccessKey?: string; formEmail?: string };

/** Where the site's forms send their messages. */
export const useWeb3Forms = Boolean(s.formAccessKey);
export const formAction = useWeb3Forms ? 'https://api.web3forms.com/submit' : `https://formsubmit.co/${s.formEmail}`;
export const formAccessKey = s.formAccessKey ?? '';
