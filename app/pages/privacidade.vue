<script setup lang="ts">
definePageMeta({ layout: false })

useSeoMeta({
  title: 'Política de Privacidade — Pherro',
  description: 'Política de Privacidade da plataforma Pherro.',
  robots: 'noindex',
})
</script>

<template>
  <LegalPage title="Política de Privacidade" updated-at="12 de julho de 2026">
    <p>
      Esta Política de Privacidade descreve como a <strong>Pherro</strong> ("Plataforma")
      trata dados pessoais, em conformidade com a Lei nº 13.709/2018 — Lei Geral de
      Proteção de Dados Pessoais (LGPD). Ela se aplica a duas categorias de titulares:
      os <strong>Lojistas</strong> (donos das lojas que contratam a Plataforma) e os
      <strong>Leads</strong> (visitantes que deixam seus dados de contato nas lojas).
    </p>

    <h2>1. Papéis no tratamento (LGPD)</h2>
    <ul>
      <li><strong>Dados de Lojistas:</strong> a Pherro é a <strong>controladora</strong> — decide como e por que os dados são tratados.</li>
      <li><strong>Dados de Leads:</strong> cada Lojista é o <strong>controlador</strong> dos dados captados em sua loja; a Pherro atua como <strong>operadora</strong>, tratando esses dados exclusivamente para prestar o serviço ao Lojista.</li>
    </ul>

    <h2>2. Dados coletados</h2>
    <h3>De Lojistas</h3>
    <ul>
      <li>Cadastro: nome da loja, e-mail, CPF ou CNPJ e senha (armazenada apenas como hash criptográfico).</li>
      <li>Faturamento: dados de cobrança processados pelo provedor de pagamentos Asaas. A Pherro não armazena dados de cartão.</li>
      <li>Uso: registros técnicos de acesso (endereço IP, data e hora), necessários para segurança e auditoria.</li>
    </ul>
    <h3>De Leads</h3>
    <ul>
      <li>Nome, telefone e, opcionalmente, e-mail — informados voluntariamente no formulário de contato antes do redirecionamento ao WhatsApp da loja, ou cadastrados manualmente pelo Lojista.</li>
      <li>Veículo de interesse associado ao contato.</li>
    </ul>

    <h2>3. Finalidades e bases legais</h2>
    <ul>
      <li><strong>Prestação do serviço</strong> (execução de contrato): operação da loja, painel administrativo, gestão de leads e envio de e-mails transacionais.</li>
      <li><strong>Cobrança</strong> (execução de contrato e obrigação legal): emissão e gestão das assinaturas via Asaas.</li>
      <li><strong>Contato comercial com o Lead</strong> (consentimento): os dados do formulário são usados pela loja para atender à solicitação de contato. Comunicações de marketing da loja dependem das práticas do Lojista, controlador desses dados.</li>
      <li><strong>Segurança</strong> (legítimo interesse): prevenção a fraudes, controle de acesso e registros de auditoria.</li>
    </ul>

    <h2>4. Compartilhamento</h2>
    <p>Os dados são compartilhados apenas com operadores essenciais ao serviço:</p>
    <ul>
      <li><strong>Asaas</strong> — processamento de pagamentos das assinaturas (dados dos Lojistas).</li>
      <li><strong>Resend</strong> — envio de e-mails transacionais e de campanhas.</li>
      <li><strong>Provedores de infraestrutura</strong> — hospedagem dos servidores e cópias de segurança.</li>
    </ul>
    <p>A Pherro não vende dados pessoais nem os compartilha para fins publicitários de terceiros.</p>

    <h2>5. Cookies e armazenamento local</h2>
    <p>
      A Plataforma utiliza apenas cookies e armazenamento local <strong>essenciais</strong>:
      sessão de autenticação do painel, preferências de interface e a lembrança de que o
      formulário de contato já foi preenchido. Não usamos cookies de publicidade ou
      rastreamento de terceiros.
    </p>

    <h2>6. Retenção e exclusão</h2>
    <ul>
      <li>Dados de Lojistas são mantidos enquanto a conta existir e, após o encerramento, pelo prazo necessário ao cumprimento de obrigações legais e fiscais.</li>
      <li>Dados de Leads são mantidos enquanto a loja do Lojista existir ou até que o Lojista os exclua, ou ainda mediante solicitação do titular (ver seção 7).</li>
      <li>Cópias de segurança são mantidas por até 30 (trinta) dias.</li>
    </ul>

    <h2>7. Direitos dos titulares</h2>
    <p>
      Nos termos do art. 18 da LGPD, você pode solicitar: confirmação de tratamento, acesso,
      correção, anonimização, portabilidade, exclusão de dados e informação sobre
      compartilhamentos, além de revogar consentimentos.
    </p>
    <ul>
      <li><strong>Lojistas:</strong> escreva para <a href="mailto:contato@pherro.app">contato@pherro.app</a>.</li>
      <li><strong>Leads:</strong> o pedido pode ser feito diretamente à loja (controladora dos seus dados) ou à Pherro, que o encaminhará ao Lojista responsável.</li>
    </ul>

    <h2>8. Segurança</h2>
    <p>
      Adotamos medidas técnicas e organizacionais adequadas: criptografia de senhas
      (argon2id), tráfego exclusivamente sobre HTTPS, isolamento de dados por loja em nível
      de banco de dados, controle de acesso por perfis e cópias de segurança diárias.
    </p>

    <h2>9. Encarregado e contato</h2>
    <p>
      O encarregado pelo tratamento de dados pessoais (DPO) da Pherro pode ser contatado em
      <a href="mailto:contato@pherro.app">contato@pherro.app</a>.
    </p>

    <h2>10. Alterações desta Política</h2>
    <p>
      Esta Política pode ser atualizada para refletir mudanças no serviço ou na legislação.
      Alterações relevantes serão comunicadas aos Lojistas por e-mail. A data da última
      atualização consta no topo da página.
    </p>
  </LegalPage>
</template>
