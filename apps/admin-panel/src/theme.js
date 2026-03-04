import { createTheme } from '@mui/material/styles';

const chromeBgStart = 'rgba(247, 233, 181, 0.96)';
const chromeBgEnd = 'rgba(236, 217, 147, 0.96)';
const chromeText = '#4f3b14';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0f56ae',
      dark: '#082077',
      light: '#5f8fd6',
    },
    secondary: {
      main: '#fc161d',
      dark: '#bd1217',
      light: '#ff6f75',
    },
    background: {
      default: '#eef3fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1f2f4c',
      secondary: '#4e5f78',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Nunito Sans", system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    h3: {
      fontFamily: '"Bree Serif", Georgia, serif',
      fontWeight: 400,
    },
    h4: {
      fontFamily: '"Bree Serif", Georgia, serif',
      fontWeight: 400,
    },
    h5: {
      fontFamily: '"Bree Serif", Georgia, serif',
      fontWeight: 400,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: `linear-gradient(120deg, ${chromeBgStart}, ${chromeBgEnd})`,
          color: chromeText,
        },
      },
    },
  },
});

export default theme;
