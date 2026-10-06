# Alienador 🛸

Extensão que bloqueia sites selecionados e exige autenticação em duas etapas (2FA via TOTP) no celular para liberar o acesso por tempo determinado.

O objetivo do **Alienador** não é apenas proibir o acesso a sites distrativos, mas introduzir uma **fricção intencional**: quebrar o ciclo de abrir abas no piloto automático ao exigir que você pegue o celular, abra seu app autenticador e digite o código de 6 dígitos para continuar navegando.

---

## ✨ Funcionalidades

* **Fricção Deliberada via 2FA:** Desbloqueio de sites protegido pelo protocolo padrão TOTP (compatível com Google Authenticator, 2FAS, Microsoft Authenticator, Aegis, etc.).
* **Janelas Temporárias de Liberação:** Escolha quanto tempo o site fica acessível após a autenticação (5, 10, 15, 30 ou 60 minutos). O bloqueio reativa automaticamente assim que o tempo expira.
* **Proteção Contra Remoção por Impulso:** Excluir um domínio da lista negra também exige validação do código no celular, evitando decisões impulsivas de contornar o bloqueio.
* **Exceções Inteligentes (Whitelist):** Permite liberar subdomínios essenciais mantendo o domínio principal restrito (por padrão, `music.youtube.com` permanece livre enquanto `youtube.com` é bloqueado).
* **Métricas Diárias de Consciência (Awareness):** Acompanhe no menu popup quantas vezes no dia você tentou acessar cada site bloqueado por hábito versus quantas vezes realmente utilizou o autenticador para liberar.
* **Portabilidade entre Perfis e Máquinas:** Suporte à importação e exportação da chave Base32, permitindo sincronizar a mesma conta 2FA em diferentes navegadores sem gerar múltiplos cadastros no celular.
* **100% Local e Privado:** Sem envio de dados, telemetria ou chaves para servidores externos. O cálculo do código é feito no próprio navegador utilizando a Web Crypto API nativa.

---

## 📁 Estrutura de Arquivos

```text
alienador/
├── manifest.json       # Configurações e permissões da extensão (Manifest V3)
├── totp.js             # Implementação nativa do algoritmo TOTP (RFC 6238 / RFC 4226)
├── background.js       # Service worker de monitoramento e interceptação de abas
├── setup.html / .js    # Tela de configuração (geração de QR Code e importação de chave)
├── blocked.html / .js  # Página de bloqueio e validação do token de liberação
└── popup.html / .js    # Painel de controle, gerenciamento de sites e métricas diárias

```

---

## 🚀 Como Instalar e Rodar Localmente

Como a extensão funciona de forma independente e sem necessidade de compilação ou dependências externas, basta carregá-la em modo desenvolvedor:

1. Clone ou baixe este repositório no seu computador:
```bash
git clone https://github.com/seu-usuario/alienador.git

```


2. Abra o Google Chrome e navegue até:
```text
chrome://extensions/

```


3. No canto superior direito, ative a opção **Modo do desenvolvedor** (*Developer mode*).
4. No canto superior esquerdo, clique no botão **Carregar sem compactação** (*Load unpacked*).
5. Selecione a pasta do projeto `alienador`.

---

## 📱 Configuração Inicial (2FA)

1. Ao carregar a extensão pela primeira vez, a tela de configuração abrirá automaticamente.
2. Abra seu aplicativo autenticador preferido no smartphone (ex.: Google Authenticator).
3. **Se for o primeiro dispositivo:** Escaneie o QR Code exibido na tela, digite o código de 6 dígitos gerado e confirme para ativar.
4. **Se quiser usar uma chave existente:** Vá para a aba *Importar Chave Existente*, cole o segredo Base32 da sua outra máquina e confirme com o código do celular.

---

## 🛠️ Tecnologias Utilizadas

* **Chrome Extensions API (Manifest V3):** `chrome.tabs`, `chrome.storage.local`, `chrome.runtime`.
* **Web Crypto API (`crypto.subtle`):** Assinatura HMAC-SHA1 nativa para cálculo local do TOTP em tempo real.
* **JavaScript Puro (Vanilla JS), HTML5 e CSS3:** Zero dependências de frameworks ou bundlers.

---

## 📄 Licença

Distribuído sob a licença MIT. Consulte `LICENSE` para mais informações.
