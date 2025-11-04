// [ADICIONADO - LOGIN CADASTRO] Sistema de usuários
const userSystem = {
    currentUser: null,
    users: JSON.parse(localStorage.getItem('estudamais_users')) || [],
    
    registerUser: function(name, email, password) {
        // Verificar se usuário já existe
        if (this.users.find(user => user.email === email)) {
            return { success: false, message: 'Este e-mail já está cadastrado.' };
        }
        
        // Criar novo usuário
        const newUser = {
            id: Date.now().toString(),
            name: name,
            email: email,
            passwordHash: btoa(password), // Criptografia simples
            createdAt: new Date().toISOString()
        };
        
        this.users.push(newUser);
        this.saveUsers();
        
        return { success: true, message: 'Cadastro realizado com sucesso!' };
    },
    
    loginUser: function(email, password) {
        const user = this.users.find(user => user.email === email);
        
        if (!user) {
            return { success: false, message: 'E-mail não encontrado.' };
        }
        
        if (user.passwordHash !== btoa(password)) {
            return { success: false, message: 'Senha incorreta.' };
        }
        
        this.currentUser = user;
        localStorage.setItem('estudamais_current_user', JSON.stringify(user));
        
        return { success: true, message: 'Login realizado com sucesso!', user: user };
    },
    
    logoutUser: function() {
        this.currentUser = null;
        localStorage.removeItem('estudamais_current_user');
    },
    
    getCurrentUser: function() {
        if (!this.currentUser) {
            const savedUser = localStorage.getItem('estudamais_current_user');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
            }
        }
        return this.currentUser;
    },
    
    saveUsers: function() {
        localStorage.setItem('estudamais_users', JSON.stringify(this.users));
    },
    
    init: function() {
        this.getCurrentUser();
        this.updateUI();
    },
    
    updateUI: function() {
        const loginBtn = document.getElementById('login-btn');
        const mobileLoginBtn = document.getElementById('mobile-login-btn');
        
        if (this.currentUser) {
            loginBtn.innerHTML = `<i class="fas fa-user"></i> Olá, ${this.currentUser.name}`;
            loginBtn.classList.add('logged-in');
            
            if (mobileLoginBtn) {
                mobileLoginBtn.innerHTML = `<i class="fas fa-user"></i> Olá, ${this.currentUser.name}`;
                mobileLoginBtn.classList.add('logged-in');
            }
        } else {
            loginBtn.innerHTML = 'Entrar / Cadastrar';
            loginBtn.classList.remove('logged-in');
            
            if (mobileLoginBtn) {
                mobileLoginBtn.innerHTML = '<i class="fas fa-user"></i> Entrar / Cadastrar';
                mobileLoginBtn.classList.remove('logged-in');
            }
        }
    }
};

// [ADICIONADO - TOAST MESSAGES] Sistema de mensagens toast
const toastSystem = {
    show: function(message, type = 'info', duration = 5000) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <div class="toast-content">${message}</div>
            <button class="toast-close"><i class="fas fa-times"></i></button>
        `;
        
        container.appendChild(toast);
        
        // Fechar toast ao clicar no X
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.hide(toast);
        });
        
        // Auto-remover após duração
        if (duration > 0) {
            setTimeout(() => {
                this.hide(toast);
            }, duration);
        }
        
        return toast;
    },
    
    hide: function(toast) {
        toast.classList.add('fade-out');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
};

// Dados do aplicativo
const appData = {
    currentUser: 'Usuário',
    subjects: ['portugues', 'matematica', 'ciencias', 'historia', 'geografia', 'redacao'],
    subjectNames: {
        'portugues': 'Português',
        'matematica': 'Matemática',
        'ciencias': 'Ciências',
        'historia': 'História',
        'geografia': 'Geografia',
        'redacao': 'Redação'
    },
    progress: {
        overall: 0,
        portugues: 0,
        matematica: 0,
        ciencias: 0,
        historia: 0,
        geografia: 0,
        redacao: 0
    },
    activity: [],
    quizzesCompleted: 0,
    simulatedCompleted: 0,
    flashcardsStudied: 0,
    essaysCorrected: 0
};

// === CONFIGURAÇÃO DA API GEMINI - INTEGRAÇÃO REAL ===
const GEMINI_API_KEY = "AIzaSyA7eXNxeVRVQrKPjGSITieU9mzrOn1Pxec"; // ← SUBSTITUA PELA SUA CHAVE REAL
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

// PROMPT INTERNO DA IA - COMPORTAMENTO DEFINIDO
const INTERNAL_AI_PROMPT = `Você é um assistente educacional do site Estuda Mais, especializado em ajudar alunos em todas as matérias escolares: Português, Matemática, Ciências, História, Geografia e Redação.

Regras de comportamento – NÃO DEIXE ESCAPAR NENHUMA:
1. Responda de forma clara, direta e objetiva.
2. **NUNCA, JAMAIS, SOB NENHUMA CIRCUNSTÂNCIA use asteriscos (*), marcadores, bullets, emojis ou qualquer formatação especial.**
3. Use parágrafos curtos, linguagem simples, acessível e didática.
4. Foque apenas no conteúdo educacional, respondendo exatamente à pergunta do aluno.
5. Se o usuário pedir explicação detalhada ou complexa, forneça uma resposta mais completa mantendo clareza e didática.
6. Caso o usuário pergunte "O que você pode fazer?" ou "Quais são suas funcionalidades?", explique claramente todas as suas capacidades:
   - Responder dúvidas de todas as matérias escolares
   - Corrigir redações seguindo critérios do ENEM
   - Explicar conceitos de forma clara e didática
   - Ajudar com quizzes, simulados e flashcards
   - Ser amigável, paciente e encorajador
7. Responda sempre em português, de forma educada e encorajadora.

Exemplo de resposta CORRETA:
"Para calcular a área do círculo, use a fórmula A = π × r², onde r é o raio."

Exemplo de resposta ERRADA:
*Olá!* Vou explicar sobre a área do círculo...
• Fórmula: A = π × r²
• Onde r é o raio

 REFORÇO ABSOLUTO: **NÃO USE NENHUM ASTERISCO, BULLET, MARCADOR OU FORMATAÇÃO ESPECIAL EM TODA RESPOSTA.`;

// Dados dos quizzes ATUALIZADOS - MAIOR DIFICULDADE (10 perguntas por matéria)
const quizData = {
    portugues: [
        {
            question: "Qual das seguintes orações apresenta um objeto indireto pleonástico?",
            options: ["A ela, nada lhe foi explicado", "Ele comprou um livro interessante", "Os alunos estudaram para a prova", "Maria chegou cedo hoje"],
            correct: 0,
            explanation: "O objeto indireto pleonástico ocorre quando o pronome oblíquo repete a informação já expressa por um termo anterior. Em 'A ela, nada lhe foi explicado', 'lhe' retoma 'a ela'."
        },
        {
            question: "Qual figura de linguagem predomina em 'O silêncio era tão profundo que se ouvia o voar das borboletas'?",
            options: ["Hipérbole", "Prosopopeia", "Metonímia", "Antítese"],
            correct: 0,
            explanation: "Hipérbole é o exagero intencional para dar ênfase. Ouvir o voar das borboletas é uma evidente hipérbole, pois isso seria impossível na realidade."
        },
        {
            question: "Em qual alternativa há erro de concordância verbal?",
            options: ["Fazem dois anos que não nos vemos", "Houveram muitos problemas na reunião", "É preciso que se faça silêncio", "Devem existir soluções para isso"],
            correct: 1,
            explanation: "O verbo 'haver' no sentido de 'existir' é impessoal, devendo ser usado sempre na 3ª pessoa do singular: 'Houve muitos problemas', não 'Houveram'."
        },
        {
            question: "Qual destes períodos pertence ao Realismo brasileiro?",
            options: ["Memórias Póstumas de Brás Cubas", "O Guarani", "Iracema", "O Cortiço"],
            correct: 0,
            explanation: "'Memórias Póstumas de Brás Cubas', de Machado de Assis (1881), marca o início do Realismo no Brasil, rompendo com o Romantismo."
        },
        {
            question: "Qual é a função sintática do termo 'que' em: 'Desejo que você venja amanhã'?",
            options: ["Pronome relativo", "Conjunção integrante", "Pronome interrogativo", "Conjunção coordenativa"],
            correct: 1,
            explanation: "'Que' funciona como conjunção integrante, introduzindo uma oração subordinada substantiva completiva nominal ('que você venha amanhã')."
        },
        {
            question: "Qual destes versos exemplifica o verso livre modernista?",
            options: ["No meio do caminho tinha uma pedra", "Os sinos dobram a finados", "Minha terra tem palmeiras", "Ouviram do Ipiranga as margens plácidas"],
            correct: 0,
            explanation: "'No meio do caminho tinha uma pedra' (Carlos Drummond de Andrade) exemplifica o verso livre modernista, sem métrica fixa nem rima."
        },
        {
            question: "Qual destas palavras apresenta ditongo nasal?",
            options: ["pão", "casa", "livro", "flor"],
            correct: 0,
            explanation: "'Pão' apresenta ditongo nasal 'ão', onde as vogais 'a' e 'o' formam um só som nasalizado."
        },
        {
            question: "Qual é a diferença entre 'onde' e 'aonde'?",
            options: ["'Onde' indica permanência, 'aonde' indica movimento", "São sinônimos perfeitos", "'Onde' é formal, 'aonde' é informal", "'Aonde' não existe na norma culta"],
            correct: 0,
            explanation: "'Onde' indica lugar em que alguém está (permanência), enquanto 'aonde' indica direção para onde alguém vai (movimento)."
        },
        {
            question: "Qual destes autores é representante do Parnasianismo?",
            options: ["Olavo Bilac", "Machado de Assis", "José de Alencar", "Gonçalves Dias"],
            correct: 0,
            explanation: "Olavo Bilac é um dos principais representantes do Parnasianismo brasileiro, movimento que valorizava a forma perfeita e o 'arte pela arte'."
        },
        {
            question: "Qual destas construções apresenta voz passiva sintética?",
            options: ["Vendem-se casas", "As casas foram vendidas", "Eles venderam as casas", "As casas estão à venda"],
            correct: 0,
            explanation: "A voz passiva sintética é construída com o verbo na 3ª pessoa + 'se' ('Vendem-se casas'), equivalente a 'Casas são vendidas'."
        }
    ],
    matematica: [
        {
            question: "Qual é o valor de x na equação log₂(x-3) + log₂(x-1) = 3?",
            options: ["5", "7", "9", "11"],
            correct: 1,
            explanation: "log₂(x-3) + log₂(x-1) = log₂[(x-3)(x-1)] = 3 → (x-3)(x-1) = 2³ = 8 → x² -4x +3 = 8 → x² -4x -5 = 0 → x = 5 ou x = -1 (não serve). Logo x = 5."
        },
        {
            question: "Qual é a soma das raízes da equação 2x³ - 5x² + 3x - 1 = 0?",
            options: ["2.5", "3", "1.5", "2"],
            correct: 0,
            explanation: "Pelas relações de Girard, a soma das raízes de ax³ + bx² + cx + d = 0 é -b/a. Portanto: -(-5)/2 = 5/2 = 2.5."
        },
        {
            question: "Qual é o valor de sen(75°)?",
            options: ["(√6 + √2)/4", "(√6 - √2)/4", "(√3 + 1)/2", "(√3 - 1)/2"],
            correct: 0,
            explanation: "sen(75°) = sen(45° + 30°) = sen45°cos30° + cos45°sen30° = (√2/2)(√3/2) + (√2/2)(1/2) = (√6 + √2)/4."
        },
        {
            question: "Qual é a equação da reta tangente à curva y = x³ - 3x no ponto (2,2)?",
            options: ["y = 9x - 16", "y = 6x - 10", "y = 3x - 4", "y = 12x - 22"],
            correct: 0,
            explanation: "Derivada: y' = 3x² - 3. No ponto x=2: y' = 3(4) - 3 = 9. Equação: y - 2 = 9(x - 2) → y = 9x - 16."
        },
        {
            question: "Qual é o valor do limite lim(x→∞) [√(x² + 3x) - x]?",
            options: ["1.5", "1", "0.5", "2"],
            correct: 0,
            explanation: "Multiplicando e dividindo pelo conjugado: [√(x² + 3x) - x] = (3x)/[√(x² + 3x) + x] = 3/[√(1 + 3/x) + 1] → 3/2 = 1.5 quando x→∞."
        },
        {
            question: "Qual é a área da região limitada pelas curvas y = x² e y = 2x?",
            options: ["4/3", "2/3", "1", "5/3"],
            correct: 0,
            explanation: "Pontos de interseção: x² = 2x → x(x-2) = 0 → x=0, x=2. Área = ∫₀² (2x - x²) dx = [x² - x³/3]₀² = 4 - 8/3 = 4/3."
        },
        {
            question: "Qual é a probabilidade de obter exatamente 2 caras em 4 lançamentos de uma moeda honesta?",
            options: ["3/8", "1/4", "1/2", "5/16"],
            correct: 0,
            explanation: "Combinações: C(4,2) = 6. Probabilidade para cada sequência: (1/2)⁴ = 1/16. Total: 6 × 1/16 = 6/16 = 3/8."
        },
        {
            question: "Qual é o valor da integral ∫ e^(2x) cos(x) dx?",
            options: ["(e^(2x)/5)(2cosx + sinx) + C", "(e^(2x))(cosx + sinx) + C", "(e^(2x)/3)(cosx + 2sinx) + C", "(e^(2x)/2)(cosx - sinx) + C"],
            correct: 0,
            explanation: "Usando integração por partes duas vezes, obtemos: ∫ e^(2x)cosx dx = (e^(2x)/5)(2cosx + sinx) + C."
        },
        {
            question: "Qual é o número de diagonais de um polígono convexo de 12 lados?",
            options: ["54", "66", "44", "60"],
            correct: 0,
            explanation: "Fórmula: D = n(n-3)/2 = 12×9/2 = 108/2 = 54 diagonais."
        },
        {
            question: "Qual é a equação do plano que passa pelos pontos (1,2,3), (2,3,1) e (3,1,2)?",
            options: ["x + y + z = 6", "2x + y - z = 3", "x - y + z = 4", "x + 2y + 3z = 14"],
            correct: 0,
            explanation: "Vetores: (1,1,-2) e (2,-1,-1). Produto vetorial: (-3,-3,-3). Equação: -3(x-1) -3(y-2) -3(z-3) = 0 → x + y + z = 6."
        }
    ],
    ciencias: [
        {
            question: "Qual é a principal função dos ribossomos na célula?",
            options: ["Síntese proteica", "Produção de ATP", "Digestão intracelular", "Armazenamento de DNA"],
            correct: 0,
            explanation: "Os ribossomos são organelas responsáveis pela síntese de proteínas, onde ocorre a tradução do RNA mensageiro em cadeias polipeptídicas."
        },
        {
            question: "Qual fenômeno explica a cor azul do céu?",
            options: ["Dispersão de Rayleigh", "Refração atmosférica", "Reflexão diferencial", "Absorção seletiva"],
            correct: 0,
            explanation: "A dispersão de Rayleigh ocorre quando partículas na atmosfera espalham mais eficientemente a luz de menor comprimento de onda (azul) do que a de maior comprimento de onda (vermelho)."
        },
        {
            question: "Qual é o princípio físico por trás do funcionamento de um submarino?",
            options: ["Princípio de Arquimedes", "Lei de Pascal", "Princípio de Bernoulli", "Lei de Hooke"],
            correct: 0,
            explanation: "O princípio de Arquimedes permite que o submarino altere sua densidade média ao encher ou esvaziar seus tanques de lastro, controlando assim sua flutuação."
        },
        {
            question: "Qual destes elementos possui maior eletronegatividade?",
            options: ["Flúor", "Oxigênio", "Nitrogênio", "Cloro"],
            correct: 0,
            explanation: "O flúor é o elemento mais eletronegativo da tabela periódica, com valor 4.0 na escala de Pauling, devido ao seu pequeno raio atômico e alta carga nuclear efetiva."
        },
        {
            question: "Qual é o mecanismo de transporte ativo através da membrana plasmática?",
            options: ["Bomba de sódio-potássio", "Difusão facilitada", "Osmose", "Difusão simples"],
            correct: 0,
            explanation: "A bomba de sódio-potássio é um exemplo clássico de transporte ativo, que consome ATP para transportar íons contra o gradiente de concentração."
        },
        {
            question: "Qual lei da termodinâmica estabelece que a entropia do universo sempre aumenta?",
            options: ["Segunda lei", "Primeira lei", "Terceira lei", "Lei zero"],
            correct: 0,
            explanation: "A segunda lei da termodinâmica estabelece que a entropia (grau de desordem) de um sistema isolado sempre aumenta com o tempo."
        },
        {
            question: "Qual destes é um exemplo de reação de dupla-troca?",
            options: ["AgNO₃ + NaCl → AgCl + NaNO₃", "2H₂ + O₂ → 2H₂O", "CaCO₃ → CaO + CO₂", "Zn + 2HCl → ZnCl₂ + H₂"],
            correct: 0,
            explanation: "Na reação AgNO₃ + NaCl → AgCl + NaNO₃, há troca de íons entre dois compostos, caracterizando uma reação de dupla-troca."
        },
        {
            question: "Qual é a função principal dos glóbulos brancos (leucócitos)?",
            options: ["Defesa imunológica", "Transporte de oxigênio", "Coagulação sanguínea", "Transporte de nutrientes"],
            correct: 0,
            explanation: "Os leucócitos são células especializadas na defesa do organismo contra agentes infecciosos e substâncias estranhas."
        },
        {
            question: "Qual fenômeno quântico explica o funcionamento dos lasers?",
            options: ["Emissão estimulada", "Efeito fotoelétrico", "Tunelamento quântico", "Supercondutividade"],
            correct: 0,
            explanation: "A emissão estimulada, prevista por Einstein, é o princípio fundamental do laser, onde um fóton incidente provoca a emissão de um fóton idêntico por um átomo excitado."
        },
        {
            question: "Qual destes processos NÃO faz parte da fotossíntese?",
            options: ["Ciclo de Krebs", "Fase luminosa", "Fase escura", "Fotólise da água"],
            correct: 0,
            explanation: "O ciclo de Krebs faz parte da respiração celular, não da fotossíntese. As fases luminosa e escura e a fotólise da água são etapas da fotossíntese."
        }
    ],
    historia: [
        {
            question: "Qual foi o principal objetivo do Congresso de Viena (1815)?",
            options: ["Restaurar o Antigo Regime na Europa", "Promover a unificação alemã", "Estabelecer a democracia", "Expandir o colonialismo"],
            correct: 0,
            explanation: "O Congresso de Viena, após a derrota de Napoleão, visava restaurar as monarquias absolutistas e o equilíbrio de poder do Antigo Regime na Europa."
        },
        {
            question: "Qual destes foi um importante líder da Revolta da Vacina (1904)?",
            options: ["Oswaldo Cruz", "Rodrigues Alves", "Lauro Sodré", "Floriano Peixoto"],
            correct: 2,
            explanation: "Lauro Sodré foi um dos principais líderes da Revolta da Vacina, movimento popular no Rio de Janeiro contra a vacinação obrigatória imposta por Oswaldo Cruz."
        },
        {
            question: "Qual era o principal produto de exportação do Brasil durante o período conhecido como 'Café com Leite'?",
            options: ["Café", "Açúcar", "Borracha", "Algodão"],
            correct: 0,
            explanation: "O café era a base da economia brasileira durante a política do Café com Leite (1894-1930), representando cerca de 70% das exportações do país."
        },
        {
            question: "Qual destes eventos marcou o início da Guerra Fria?",
            options: ["Doutrina Truman (1947)", "Queda do Muro de Berlim (1989)", "Crise dos Mísseis (1962)", "Revolução Cubana (1959)"],
            correct: 0,
            explanation: "A Doutrina Truman, anunciada em 1947, marcou o início oficial da Guerra Fria ao estabelecer a política de contenção do comunismo pelos EUA."
        },
        {
            question: "Qual civilização desenvolveu o sistema de escrita cuneiforme?",
            options: ["Sumérios", "Egípcios", "Fenícios", "Gregos"],
            correct: 0,
            explanation: "Os sumérios, na Mesopotâmia, desenvolveram a escrita cuneiforme por volta de 3200 a.C., uma das mais antigas formas de escrita da humanidade."
        },
        {
            question: "Qual foi o principal acordo que encerrou a Guerra do Paraguai?",
            options: ["Tratado da Tríplice Aliança", "Tratado de Petrópolis", "Tratado de Assunção", "Tratado de Ayacucho"],
            correct: 2,
            explanation: "O Tratado de Assunção, assinado em 1872, encerrou oficialmente a Guerra do Paraguai, impondo pesadas condições de rendição ao Paraguai."
        },
        {
            question: "Qual destes filósofos foi um dos principais ideólogos do Iluminismo?",
            options: ["Montesquieu", "Maquiavel", "Santo Agostinho", "São Tomás de Aquino"],
            correct: 0,
            explanation: "Montesquieu foi um importante filósofo iluminista, conhecido pela teoria da separação dos poderes (Executivo, Legislativo e Judiciário)."
        },
        {
            question: "Qual foi o principal motivo da Inconfidência Mineira (1789)?",
            options: ["Opressão fiscal portuguesa", "Questão religiosa", "Disputas territoriais", "Abolição da escravidão"],
            correct: 0,
            explanation: "A opressão fiscal portuguesa, especialmente a derrama (cobrança forçada de impostos atrasados), foi o principal motivo da Inconfidência Mineira."
        },
        {
            question: "Qual destes impérios dominou a Península Ibérica durante a Idade Média?",
            options: ["Império Islâmico", "Império Bizantino", "Império Carolíngio", "Império Mongol"],
            correct: 0,
            explanation: "O Império Islâmico, através dos mouros, dominou a Península Ibérica entre os séculos VIII e XV, no período conhecido como Al-Andalus."
        },
        {
            question: "Qual foi o principal resultado da Conferência de Berlim (1884-1885)?",
            options: ["Partilha da África", "Unificação da Alemanha", "Independência da América", "Fim da escravidão"],
            correct: 0,
            explanation: "A Conferência de Berlin estabeleceu as regras para a partilha da África entre as potências europeias, sem considerar as divisões étnicas e culturais locais."
        }
    ],
    geografia: [
        {
            question: "Qual fenômeno climático é responsável pelas chuvas de monção no sul da Ásia?",
            options: ["Ventos sazonais que invertem de direção", "Correntes oceânicas quentes", "Efeito orográfico", "El Niño"],
            correct: 0,
            explanation: "As monções são ventos sazonais que invertem de direção entre verão e inverno, trazendo chuvas intensas no verão quando sopram do oceano para o continente."
        },
        {
            question: "Qual destes países NÃO faz parte do Mercosul?",
            options: ["Chile", "Brasil", "Argentina", "Paraguai"],
            correct: 0,
            explanation: "O Chile é membro associado do Mercosul, mas não é membro pleno. Brasil, Argentina, Paraguai e Uruguai são os membros fundadores."
        },
        {
            question: "Qual é o principal tipo de solo encontrado na região amazônica?",
            options: ["Latossolos", "Podzóis", "Chernossolos", "Planossolos"],
            correct: 0,
            explanation: "Os latossolos são os solos predominantes na Amazônia, caracterizados por serem profundos, bem drenados, mas geralmente pobres em nutrientes."
        },
        {
            question: "Qual destes é um exemplo de cidade global?",
            options: ["Nova York", "Brasília", "Cancún", "Orlando"],
            correct: 0,
            explanation: "Nova York é considerada uma cidade global por sua influência econômica, cultural e política em escala mundial, sediando importantes instituições internacionais."
        },
        {
            question: "Qual fenômeno geológico formou a Cordilheira dos Andes?",
            options: ["Colisão entre placas tectônicas", "Erupções vulcânicas isoladas", "Glaciação", "Erosão fluvial"],
            correct: 0,
            explanation: "A Cordilheira dos Andes foi formada pela colisão entre a placa de Nazca e a placa Sul-Americana, em um processo de subducção que continua até hoje."
        },
        {
            question: "Qual destes países possui o maior IDH (Índice de Desenvolvimento Humano)?",
            options: ["Noruega", "Estados Unidos", "Japão", "Alemanha"],
            correct: 0,
            explanation: "A Noruega frequentemente ocupa a primeira posição no ranking de IDH, devido aos seus altos índices de renda, educação e expectativa de vida."
        },
        {
            question: "Qual é o principal bioma da região centro-oeste do Brasil?",
            options: ["Cerrado", "Caatinga", "Mata Atlântica", "Amazônia"],
            correct: 0,
            explanation: "O Cerrado é o bioma predominante na região centro-oeste, caracterizado por vegetação de savana e grande biodiversidade."
        },
        {
            question: "Qual destes é um país transcontinental?",
            options: ["Turquia", "Egito", "Rússia", "Todos os anteriores"],
            correct: 3,
            explanation: "Todos são países transcontinentais: Turquia (Europa/Ásia), Egito (África/Ásia), Rússia (Europa/Ásia)."
        },
        {
            question: "Qual é o principal fator responsável pela desertificação do Nordeste brasileiro?",
            options: ["Ação antrópica e condições climáticas", "Variação da órbita terrestre", "Correntes oceânicas frias", "Deforestação amazônica"],
            correct: 0,
            explanation: "A desertificação no Nordeste resulta da combinação entre ações humanas (desmatamento, agricultura inadequada) e condições climáticas naturais (semiárido)."
        },
        {
            question: "Qual destes é um exemplo de migração pendular?",
            options: ["Deslocamento diário casa-trabalho", "Migração rural-urbana", "Êxodo de refugiados", "Migração sazonal"],
            correct: 0,
            explanation: "Migração pendular refere-se ao deslocamento diário de pessoas entre sua residência e local de trabalho/estudo, comum nas grandes metrópoles."
        }
    ],
    redacao: [
        {
            question: "Qual destes elementos é ESSENCIAL na proposta de intervenção do ENEM?",
            options: ["Agente, ação, meio/Modo, finalidade", "Introdução, desenvolvimento, conclusão", "Tese, argumentos, exemplos", "Título, subtítulo, referências"],
            correct: 0,
            explanation: "A proposta de intervenção deve conter: AGENTE (quem fará), AÇÃO (o que será feito), MEIO/MODO (como será feito) e FINALIDADE (para que será feito)."
        },
        {
            question: "Qual erro NÃO constitui penalização na competência 1 do ENEM?",
            options: ["Uso de linguagem informal contextualizada", "Desrespeito aos direitos humanos", "Fuga ao tema", "Texto insuficiente"],
            correct: 0,
            explanation: "O uso pontual de linguagem informal, quando bem contextualizado e justificado, pode não ser penalizado. Os demais itens são penalizações graves."
        },
        {
            question: "Qual destes conectivos é adequado para expressar CONCLUSÃO?",
            options: ["Portanto, logo, assim", "Além disso, outrossim", "Por exemplo, isto é", "No entanto, contudo"],
            correct: 0,
            explanation: "'Portanto', 'logo' e 'assim' são conectivos que indicam conclusão ou consequência lógica do que foi exposto anteriormente."
        },
        {
            question: "O que caracteriza um repertório sociocultural produtivo?",
            options: ["Apropriação crítica de conhecimentos", "Citação de autores famosos", "Uso de dados estatísticos", "Referência a filmes recentes"],
            correct: 0,
            explanation: "Repertório produtivo não é apenas citar, mas apropriar-se criticamente do conhecimento, relacionando-o de forma pertinente ao tema e à argumentação."
        },
        {
            question: "Qual destes NÃO é um critério da competência 3 do ENEM?",
            options: ["Coesão textual", "Seleção de informações", "Organização do texto", "Desenvolvimento do tema"],
            correct: 0,
            explanation: "A coesão textual é avaliada na competência 4. A competência 3 avalia seleção, organização e interpretação de informações."
        },
        {
            question: "Qual é a função principal do parágrafo de desenvolvimento?",
            options: ["Apresentar e fundamentar argumentos", "Introduzir o tema", "Concluir o raciocínio", "Apresentar a proposta"],
            correct: 0,
            explanation: "Os parágrafos de desenvolvimento devem apresentar argumentos sólidos e fundamentá-los com explicações, exemplos e dados concretos."
        },
        {
            question: "O que caracteriza a 'fuga ao tema' na redação do ENEM?",
            options: ["Desconsiderar a proposta temática", "Escrever sobre assunto diferente", "Tangenciar o tema proposto", "Todas as anteriores"],
            correct: 3,
            explanation: "Fuga ao tema inclui escrever sobre assunto completamente diferente, desconsiderar a proposta ou apenas tangenciar o tema sem desenvolvê-lo adequadamente."
        },
        {
            question: "Qual destes elementos NÃO deve aparecer na introdução?",
            options: ["Proposta de intervenção detalhada", "Apresentação do tema", "Tese do autor", "Contextualização"],
            correct: 0,
            explanation: "A proposta de intervenção detalhada deve aparecer apenas na conclusão. A introdução deve apresentar tema, contextualização e tese."
        },
        {
            question: "Qual é a diferença entre coesão e coerência textual?",
            options: ["Coesão: conexão entre partes; Coerência: lógica do texto", "São sinônimos", "Coesão: clareza; Coerência: gramática", "Coesão: conteúdo; Coerência: forma"],
            correct: 0,
            explanation: "Coesão refere-se aos mecanismos de conexão entre as partes do texto. Coerência diz respeito à lógica interna e ao sentido global do texto."
        },
        {
            question: "Qual destas estratégias NÃO é recomendada para o desenvolvimento?",
            options: ["Argumentação circular", "Exemplificação concreta", "Dados estatísticos", "Causa e consequência"],
            correct: 0,
            explanation: "A argumentação circular (repetir a mesma ideia com palavras diferentes) empobrece o texto. As demais estratégias enriquecem a argumentação."
        }
    ]
};

// Dados dos flashcards COMPLETOS - 10 flashcards por matéria
const flashcardData = {
    portugues: [
        { question: "O que é uma metáfora?", answer: "Figura de linguagem que estabelece uma comparação implícita entre dois elementos, sem usar termos comparativos explícitos." },
        { question: "Qual a diferença entre denotação e conotação?", answer: "Denotação é o uso literal da palavra, seu sentido objetivo. Conotação é o uso figurado, com sentido subjetivo e sugestivo." },
        { question: "O que é uma oração subordinada?", answer: "É uma oração que depende sintaticamente de outra, não podendo existir sozinha. Ex: 'Espero que você venha' - 'que você venha' é subordinada." },
        { question: "O que é um substantivo abstrato?", answer: "É um substantivo que designa qualidades, sentimentos, estados ou ações, que não existem por si mesmos. Ex: amor, beleza, alegria." },
        { question: "Qual a função do adjunto adverbial?", answer: "É um termo acessório da oração que modifica o verbo, indicando circunstância de tempo, lugar, modo, etc." },
        { question: "O que é uma sinédoque?", answer: "Figura de linguagem que consiste em tomar a parte pelo todo, o todo pela parte, etc. Ex: 'Elas são belas faces' (faces por pessoas)." },
        { question: "Qual a diferença entre crase e acento agudo?", answer: "Crase é a fusão da preposição 'a' com o artigo 'a' ou pronomes, representada pelo acento grave. Acento agudo marca vogal tônica aberta." },
        { question: "O que é uma antítese?", answer: "Figura de pensamento que aproxima palavras ou expressões de sentidos opostos. Ex: 'O amor é fogo que arde sem se ver'." },
        { question: "Qual a função do aposto?", answer: "Termo que explica, enumera ou especifica um substantivo. Ex: 'Rio de Janeiro, capital do Brasil, é linda'." },
        { question: "O que é polissemia?", answer: "Fenômeno em que uma mesma palavra possui vários significados. Ex: 'cabo' pode ser posto militar, extremidade de objeto, etc." }
    ],
    matematica: [
        { question: "O que é o Teorema de Pitágoras?", answer: "Em um triângulo retângulo, o quadrado da hipotenusa é igual à soma dos quadrados dos catetos: a² = b² + c²." },
        { question: "Como calcular a área de um círculo?", answer: "A área de um círculo é calculada pela fórmula A = π × r², onde r é o raio do círculo." },
        { question: "O que são números primos?", answer: "São números naturais maiores que 1 que possuem apenas dois divisores: 1 e ele mesmo. Ex: 2, 3, 5, 7, 11, 13..." },
        { question: "Como resolver uma equação do segundo grau?", answer: "Usando a fórmula de Bhaskara: x = [-b ± √(b² - 4ac)] / 2a, onde a, b e c são os coeficientes da equação ax² + bx + c = 0." },
        { question: "O que é a razão áurea?", answer: "É uma constante real algébrica irracional representada pela letra grega φ (phi), aproximadamente 1,61803, que aparece em diversas proporções na natureza e arte." },
        { question: "Como calcular juros compostos?", answer: "M = C × (1 + i)ⁿ, onde M é o montante, C é o capital, i é a taxa de juros e n é o número de períodos." },
        { question: "O que é um logaritmo?", answer: "É o expoente a que se deve elevar uma base para obter um determinado número. Se aˣ = b, então logₐb = x." },
        { question: "Como calcular a média aritmética?", answer: "Soma de todos os valores dividida pelo número de valores. Média = (x₁ + x₂ + ... + xₙ) / n." },
        { question: "O que é uma função quadrática?", answer: "É uma função polinomial de grau 2, representada por f(x) = ax² + bx + c, cujo gráfico é uma parábola." },
        { question: "Como calcular o volume de uma esfera?", answer: "V = (4/3) × π × r³, onde r é o raio da esfera." }
    ],
    ciencias: [
        { question: "O que é a fotossíntese?", answer: "Processo pelo qual plantas e alguns outros organismos convertem luz solar, água e CO₂ em glicose e oxigênio, usando clorofila." },
        { question: "Quais são os três estados da matéria?", answer: "Sólido (forma e volume definidos), líquido (volume definido, forma variável) e gasoso (forma e volume variáveis)." },
        { question: "O que é o DNA?", answer: "Ácido desoxirribonucleico, molécula que contém as informações genéticas hereditárias em todos os seres vivos." },
        { question: "Como se formam os fósseis?", answer: "Através da preservação de restos de seres vivos em rochas sedimentares, geralmente por mineralização ou moldagem." },
        { question: "O que é a teoria da evolução?", answer: "Proposta por Charles Darwin, explica como as espécies mudam ao longo do tempo através da seleção natural e adaptação ao ambiente." },
        { question: "Quais são as leis de Newton?", answer: "1ª: Inércia; 2ª: F = m × a; 3ª: Ação e reação - para toda ação há uma reação igual e oposta." },
        { question: "O que é a tabela periódica?", answer: "Organização dos elementos químicos em ordem crescente de número atômico, agrupados por propriedades semelhantes." },
        { question: "Como funciona o sistema circulatório?", answer: "Transporta oxigênio, nutrientes e hormônios para as células, e remove dióxido de carbono e resíduos, usando o coração como bomba." },
        { question: "O que são células-tronco?", answer: "Células indiferenciadas que podem se transformar em diferentes tipos de células especializadas do corpo." },
        { question: "Como ocorre um eclipse solar?", answer: "Quando a Lua passa entre a Terra e o Sol, projetando sua sombra na Terra e bloqueando total ou parcialmente a luz solar." }
    ],
    historia: [
        { question: "O que foi o Iluminismo?", answer: "Movimento intelectual do século XVIII que defendia a razão, a liberdade e a ciência como bases do conhecimento e da sociedade." },
        { question: "Quais foram as causas da Primeira Guerra Mundial?", answer: "Imperialismo, nacionalismo, sistema de alianças e o assassinato do arquiduque Francisco Ferdinando em 1914." },
        { question: "O que foi a Revolução Industrial?", answer: "Transição para novos processos de manufatura no período de 1760 a 1840, marcada pela mecanização e fábricas." },
        { question: "Quem foi Getúlio Vargas?", answer: "Presidente do Brasil por 15 anos (1930-1945 e 1951-1954), conhecido por criar leis trabalhistas e industrializar o país." },
        { question: "O que foi o Apartheid?", answer: "Sistema de segregação racial institucionalizado na África do Sul entre 1948 e 1994, que privilegiava a minoria branca." },
        { question: "Quem foram os faraós?", answer: "Governantes do Antigo Egito, considerados descendentes diretos dos deuses e com poder absoluto sobre o Estado." },
        { question: "O que foi a Guerra Fria?", answer: "Conflito ideológico, político e econômico entre EUA (capitalismo) e URSS (comunismo) de 1947 a 1991, sem confronto direto." },
        { question: "Quem foi Tiradentes?", answer: "Joaquim José da Silva Xavier, líder da Inconfidência Mineira (1789), executado e tornou-se mártir da independência do Brasil." },
        { question: "O que foi o Renascimento?", answer: "Movimento cultural dos séculos XIV-XVI que reviveu o interesse pela arte, literatura e valores da Antiguidade Clássica." },
        { question: "Quem foi Mahatma Gandhi?", answer: "Líder do movimento de independência da Índia, conhecido por sua filosofia de resistência não violenta (satyagraha)." }
    ],
    geografia: [
        { question: "O que é globalização?", answer: "Processo de integração econômica, cultural e social entre diferentes países, facilitado pelos avanços tecnológicos e de comunicação." },
        { question: "Quais são os tipos de clima?", answer: "Equatorial, tropical, temperado, mediterrâneo, desértico, semiárido, frio, polar e de altitude." },
        { question: "O que é o efeito estufa?", answer: "Fenômeno natural em que gases na atmosfera retêm parte do calor do Sol, mantendo a Terra aquecida. O aumento artificial causa aquecimento global." },
        { question: "Quais são os biomas brasileiros?", answer: "Amazônia, Cerrado, Mata Atlântica, Caatinga, Pampa e Pantanal." },
        { question: "O que é urbanização?", answer: "Processo de crescimento das cidades em relação às áreas rurais, com aumento da população urbana." },
        { question: "Quais são as camadas da Terra?", answer: "Crosta (superfície), manto (intermediária) e núcleo (centro, dividido em externo líquido e interno sólido)." },
        { question: "O que é PIB?", answer: "Produto Interno Bruto - soma de todos os bens e serviços finais produzidos em um país durante um período, geralmente um ano." },
        { question: "Quais são os tipos de rochas?", answer: "Ígneas (formadas pelo resfriamento do magma), sedimentares (formadas por acúmulo de sedimentos) e metamórficas (transformadas por calor/pressão)." },
        { question: "O que é latitude e longitude?", answer: "Coordenadas geográficas: latitude mede a distância norte-sul do Equador; longitude mede a distância leste-oeste do Meridiano de Greenwich." },
        { question: "Quais são os países do BRICS?", answer: "Brasil, Rússia, Índia, China e África do Sul - grupo de economias emergentes com potencial de crescimento." }
    ],
    redacao: [
        { question: "Quais são as 5 competências do ENEM?", answer: "1. Domínio da norma padrão; 2. Compreensão da proposta; 3. Seleção e organização de informações; 4. Conhecimento da língua; 5. Proposta de intervenção." },
        { question: "O que é tese em uma redação?", answer: "Posicionamento claro do autor sobre o tema, que será defendido ao longo do texto com argumentos consistentes." },
        { question: "O que é coesão textual?", answer: "Ligação harmoniosa entre as partes do texto, usando conectivos, pronomes e outros recursos para garantir fluidez e compreensão." },
        { question: "O que é coerência textual?", answer: "Lógica interna do texto, com ideias que se relacionam de forma consistente e sem contradições." },
        { question: "Como fazer uma boa introdução?", answer: "Apresentar o tema, contextualizá-lo e apresentar a tese que será desenvolvida, despertando o interesse do leitor." },
        { question: "O que é um argumento de autoridade?", answer: "Argumento que cita especialistas, dados científicos ou fontes confiáveis para fortalecer a tese defendida." },
        { question: "Como elaborar uma proposta de intervenção?", answer: "Sugerir ação concreta para resolver o problema, indicando agente, ação, meio/modo, efeito/finalidade e detalhamento." },
        { question: "O que evitar em uma redação?", answer: "Gírias, clichês, repetições excessivas, generalizações, fuga ao tema e desrespeito aos direitos humanos." },
        { question: "O que é repertório sociocultural?", answer: "Conjunto de conhecimentos (literatura, filosofia, história, atualidades) que o autor demonstra ter para fundamentar seus argumentos." },
        { question: "Como usar citações em uma redação?", answer: "Inserir de forma natural, relacionando ao argumento, citando autor quando conhecido e sempre entre aspas quando texto literal." }
    ]
};

// Dados do simulado COMPLETOS
const simulatedData = [
    // Português
    {
        question: "Qual das seguintes orações apresenta um objeto indireto pleonástico?",
        options: ["A ela, nada lhe foi explicado", "Ele comprou um livro interessante", "Os alunos estudaram para a prova", "Maria chegou cedo hoje"],
        correct: 0,
        subject: "portugues",
        explanation: "O objeto indireto pleonástico ocorre quando o pronome oblíquo repete a informação já expressa por um termo anterior. Em 'A ela, nada lhe foi explicado', 'lhe' retoma 'a ela'."
    },
    {
        question: "Qual figura de linguagem predomina em 'O silêncio era tão profundo que se ouvia o voar das borboletas'?",
        options: ["Hipérbole", "Prosopopeia", "Metonímia", "Antítese"],
        correct: 0,
        subject: "portugues",
        explanation: "Hipérbole é o exagero intencional para dar ênfase. Ouvir o voar das borboletas é uma evidente hipérbole, pois isso seria impossível na realidade."
    },
    // Matemática
    {
        question: "Qual é o valor de x na equação log₂(x-3) + log₂(x-1) = 3?",
        options: ["5", "7", "9", "11"],
        correct: 0,
        subject: "matematica",
        explanation: "log₂(x-3) + log₂(x-1) = log₂[(x-3)(x-1)] = 3 → (x-3)(x-1) = 2³ = 8 → x² -4x +3 = 8 → x² -4x -5 = 0 → x = 5 ou x = -1 (não serve). Logo x = 5."
    },
    {
        question: "Qual é a soma das raízes da equação 2x³ - 5x² + 3x - 1 = 0?",
        options: ["2.5", "3", "1.5", "2"],
        correct: 0,
        subject: "matematica",
        explanation: "Pelas relações de Girard, a soma das raízes de ax³ + bx² + cx + d = 0 é -b/a. Portanto: -(-5)/2 = 5/2 = 2.5."
    },
    // Ciências
    {
        question: "Qual é a principal função dos ribossomos na célula?",
        options: ["Síntese proteica", "Produção de ATP", "Digestão intracelular", "Armazenamento de DNA"],
        correct: 0,
        subject: "ciencias",
        explanation: "Os ribossomos são organelas responsáveis pela síntese de proteínas, onde ocorre a tradução do RNA mensageiro em cadeias polipeptídicas."
    },
    {
        question: "Qual fenômeno explica a cor azul do céu?",
        options: ["Dispersão de Rayleigh", "Refração atmosférica", "Reflexão diferencial", "Absorção seletiva"],
        correct: 0,
        subject: "ciencias",
        explanation: "A dispersão de Rayleigh ocorre quando partículas na atmosfera espalham mais eficientemente a luz de menor comprimento de onda (azul) do que a de maior comprimento de onda (vermelho)."
    },
    // História
    {
        question: "Qual foi o principal objetivo do Congresso de Viena (1815)?",
        options: ["Restaurar o Antigo Regime na Europa", "Promover a unificação alemã", "Estabelecer a democracia", "Expandir o colonialismo"],
        correct: 0,
        subject: "historia",
        explanation: "O Congresso de Viena, após a derrota de Napoleão, visava restaurar as monarquias absolutistas e o equilíbrio de poder do Antigo Regime na Europa."
    },
    {
        question: "Qual destes foi um importante líder da Revolta da Vacina (1904)?",
        options: ["Oswaldo Cruz", "Rodrigues Alves", "Lauro Sodré", "Floriano Peixoto"],
        correct: 2,
        subject: "historia",
        explanation: "Lauro Sodré foi um dos principais líderes da Revolta da Vacina, movimento popular no Rio de Janeiro contra a vacinação obrigatória imposta por Oswaldo Cruz."
    },
    // Geografia
    {
        question: "Qual fenômeno climático é responsável pelas chuvas de monção no sul da Ásia?",
        options: ["Ventos sazonais que invertem de direção", "Correntes oceânicas quentes", "Efeito orográfico", "El Niño"],
        correct: 0,
        subject: "geografia",
        explanation: "As monções são ventos sazonais que invertem de direção entre verão e inverno, trazendo chuvas intensas no verão quando sopram do oceano para o continente."
    },
    {
        question: "Qual destes países NÃO faz parte do Mercosul?",
        options: ["Chile", "Brasil", "Argentina", "Paraguai"],
        correct: 0,
        subject: "geografia",
        explanation: "O Chile é membro associado do Mercosul, mas não é membro pleno. Brasil, Argentina, Paraguai e Uruguai são os membros fundadores."
    },
    // Redação
    {
        question: "Qual destes elementos é ESSENCIAL na proposta de intervenção do ENEM?",
        options: ["Agente, ação, meio/Modo, finalidade", "Introdução, desenvolvimento, conclusão", "Tese, argumentos, exemplos", "Título, subtítulo, referências"],
        correct: 0,
        subject: "redacao",
        explanation: "A proposta de intervenção deve conter: AGENTE (quem fará), AÇÃO (o que será feito), MEIO/MODO (como será feito) e FINALIDADE (para que será feito)."
    },
    {
        question: "Qual erro NÃO constitui penalização na competência 1 do ENEM?",
        options: ["Uso de linguagem informal contextualizada", "Desrespeito aos direitos humanos", "Fuga ao tema", "Texto insuficiente"],
        correct: 0,
        subject: "redacao",
        explanation: "O uso pontual de linguagem informal, quando bem contextualizado e justificado, pode não ser penalizado. Os demais itens são penalizações graves."
    },
    // Mais questões para completar 20
    {
        question: "Qual é o valor de sen(75°)?",
        options: ["(√6 + √2)/4", "(√6 - √2)/4", "(√3 + 1)/2", "(√3 - 1)/2"],
        correct: 0,
        subject: "matematica",
        explanation: "sen(75°) = sen(45° + 30°) = sen45°cos30° + cos45°sen30° = (√2/2)(√3/2) + (√2/2)(1/2) = (√6 + √2)/4."
    },
    {
        question: "Qual é o princípio físico por trás do funcionamento de um submarino?",
        options: ["Princípio de Arquimedes", "Lei de Pascal", "Princípio de Bernoulli", "Lei de Hooke"],
        correct: 0,
        subject: "ciencias",
        explanation: "O princípio de Arquimedes permite que o submarino altere sua densidade média ao encher ou esvaziar seus tanques de lastro, controlando assim sua flutuação."
    },
    {
        question: "Qual era o principal produto de exportação do Brasil durante o período conhecido como 'Café com Leite'?",
        options: ["Café", "Açúcar", "Borracha", "Algodão"],
        correct: 0,
        subject: "historia",
        explanation: "O café era a base da economia brasileira durante a política do Café com Leite (1894-1930), representando cerca de 70% das exportações do país."
    },
    {
        question: "Qual é o principal tipo de solo encontrado na região amazônica?",
        options: ["Latossolos", "Podzóis", "Chernossolos", "Planossolos"],
        correct: 0,
        subject: "geografia",
        explanation: "Os latossolos são os solos predominantes na Amazônia, caracterizados por serem profundos, bem drenados, mas geralmente pobres em nutrientes."
    },
    {
        question: "O que caracteriza um repertório sociocultural produtivo?",
        options: ["Apropriação crítica de conhecimentos", "Citação de autores famosos", "Uso de dados estatísticos", "Referência a filmes recentes"],
        correct: 0,
        subject: "redacao",
        explanation: "Repertório produtivo não é apenas citar, mas apropriar-se criticamente do conhecimento, relacionando-o de forma pertinente ao tema e à argumentação."
    },
    {
        question: "Em qual alternativa há erro de concordância verbal?",
        options: ["Fazem dois anos que não nos vemos", "Houveram muitos problemas na reunião", "É preciso que se faça silêncio", "Devem existir soluções para isso"],
        correct: 1,
        subject: "portugues",
        explanation: "O verbo 'haver' no sentido de 'existir' é impessoal, devendo ser usado sempre na 3ª pessoa do singular: 'Houve muitos problemas', não 'Houveram'."
    },
    {
        question: "Qual é a área da região limitada pelas curvas y = x² e y = 2x?",
        options: ["4/3", "2/3", "1", "5/3"],
        correct: 0,
        subject: "matematica",
        explanation: "Pontos de interseção: x² = 2x → x(x-2) = 0 → x=0, x=2. Área = ∫₀² (2x - x²) dx = [x² - x³/3]₀² = 4 - 8/3 = 4/3."
    },
    {
        question: "Qual destes elementos possui maior eletronegatividade?",
        options: ["Flúor", "Oxigênio", "Nitrogênio", "Cloro"],
        correct: 0,
        subject: "ciencias",
        explanation: "O flúor é o elemento mais eletronegativo da tabela periódica, com valor 4.0 na escala de Pauling, devido ao seu pequeno raio atômico e alta carga nuclear efetiva."
    }
];

// Estado atual do aplicativo
let currentState = {
    currentSection: 'home',
    currentQuiz: null,
    currentQuizIndex: 0,
    quizAnswers: [],
    quizScore: 0,
    currentSimulated: [],
    currentSimulatedIndex: 0,
    simulatedAnswers: [],
    simulatedScore: 0,
    simulatedTime: 3600,
    simulatedTimer: null,
    currentFlashcards: null,
    currentFlashcardIndex: 0,
    flashcardsLearned: [],
    flashcardsToReview: [],
    essayText: '',
    chatMessages: [
        {
            role: 'ai',
            content: 'Olá! Sou seu assistente de estudos do Estuda Mais. Posso ajudar com dúvidas sobre qualquer matéria ou corrigir sua redação! Como posso ajudá-lo hoje?'
        }
    ]
};

// === FUNÇÕES DA IA GEMINI - INTEGRAÇÃO REAL ===

// FUNÇÃO PRINCIPAL DA IA - INTEGRAÇÃO REAL
async function getRealAIResponse(userMessage) {
    // Verifica se a chave API está configurada
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "COLE_SUA_CHAVE_AQUI") {
        throw new Error('Chave da API não configurada. Configure GEMINI_API_KEY com sua chave real.');
    }

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${INTERNAL_AI_PROMPT}

Pergunta do usuário: ${userMessage}

Por favor, responda de forma educada, clara e direta, focada no aprendizado.`
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Resposta da API inválida');
        }
        
    } catch (error) {
        console.error('Erro na chamada da API Gemini:', error);
        throw error;
    }
}

// FUNÇÃO DE CORREÇÃO DE REDAÇÃO COM IA REAL
async function correctEssayWithAI(essayText) {
    const prompt = `Por favor, corrija a seguinte redação seguindo as competências do ENEM:

TEMA: "Os desafios da educação no Brasil no século XXI"

REDAÇÃO DO ALUNO:
${essayText}

Forneça uma correção detalhada com:
1. Nota geral (0-1000) e justificativa
2. Análise de cada competência do ENEM
3. Pontos fortes específicos
4. Pontos de melhoria com sugestões concretas
5. Recomendações para melhorar a nota`;

    return await getRealAIResponse(prompt);
}

// FUNÇÃO ATUALIZADA DE RESPOSTA DA IA - SEM FALLBACK SIMULADO
async function getAIResponse(userMessage) {
    // Adiciona mensagem de "digitando..."
    const typingMessage = {
        role: 'ai',
        content: 'Analisando sua pergunta...',
        isTyping: true
    };
    
    currentState.chatMessages.push(typingMessage);
    updateChatDisplay();
    
    try {
        const response = await getRealAIResponse(userMessage);
        
        // Remove a mensagem de "digitando" e adiciona a resposta real
        currentState.chatMessages.pop();
        currentState.chatMessages.push({
            role: 'ai',
            content: response
        });
        
    } catch (error) {
        // Remove a mensagem de "digitando"
        currentState.chatMessages.pop();
        
        // Mensagem de erro específica
        let errorMessage = '';
        
        if (error.message.includes('Chave da API não configurada')) {
            errorMessage = `🔧 **Configuração Necessária**

Para usar o assistente de IA, é necessário configurar a chave da API Gemini:

1. Obtenha uma chave API gratuita em: https://aistudio.google.com/
2. No arquivo JavaScript (linha 10), substitua:
   \`const GEMINI_API_KEY = "COLE_SUA_CHAVE_AQUI";\`
   por:
   \`const GEMINI_API_KEY = "SUA_CHAVE_AQUI";\`

**Exemplo:**
\`\`\`javascript
const GEMINI_API_KEY = "AIzaSyBexemplo1234567890ABCDEFGHIJKLMN";
\`\`\`

Após configurar, recarregue a página e a IA funcionará perfeitamente! 🚀`;
        } else if (error.message.includes('Erro na API: 401') || error.message.includes('Erro na API: 403')) {
            errorMessage = '🔑 **Erro de Autenticação**\n\nA chave da API configurada é inválida ou expirou. Verifique se a chave está correta e ativa.';
        } else if (error.message.includes('Erro na API: 429')) {
            errorMessage = '⏰ **Limite de Uso Atingido**\n\nMuitas requisições em um curto período. Tente novamente em alguns minutos.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = '🌐 **Problema de Conexão**\n\nVerifique sua conexão com a internet e tente novamente.';
        } else {
            errorMessage = '❌ **Erro Temporário**\n\nO serviço de IA está temporariamente indisponível. Tente novamente em alguns minutos.';
        }
        
        currentState.chatMessages.push({
            role: 'ai',
            content: errorMessage
        });
    }
    
    updateChatDisplay();
    saveState();
}

// [ADICIONADO - LOGIN CADASTRO] Funções do sistema de login
function openLoginModal() {
    document.getElementById('login-modal').classList.remove('hidden');
    switchTab('login');
}

function closeLoginModal() {
    document.getElementById('login-modal').classList.add('hidden');
    // Limpar formulários
    document.getElementById('login-form').reset();
    document.getElementById('register-form').reset();
    // Limpar mensagens
    document.getElementById('login-message').innerHTML = '';
    document.getElementById('register-message').innerHTML = '';
}

function switchTab(tabName) {
    // Atualizar botões das abas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });
    
    // Atualizar conteúdo das abas
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.toggle('active', pane.id === `${tabName}-tab`);
    });
    
    // Limpar mensagens
    document.getElementById('login-message').innerHTML = '';
    document.getElementById('register-message').innerHTML = '';
}

function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const messageElement = document.getElementById('login-message');
    
    if (!email || !password) {
        showFormMessage(messageElement, 'Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    const result = userSystem.loginUser(email, password);
    
    if (result.success) {
        showFormMessage(messageElement, result.message, 'success');
        userSystem.updateUI();
        setTimeout(() => {
            closeLoginModal();
            toastSystem.show(`Bem-vindo(a) de volta, ${result.user.name}!`, 'success');
        }, 1500);
    } else {
        showFormMessage(messageElement, result.message, 'error');
    }
}

function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const messageElement = document.getElementById('register-message');
    
    if (!name || !email || !password || !confirmPassword) {
        showFormMessage(messageElement, 'Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    if (password.length < 6) {
        showFormMessage(messageElement, 'A senha deve ter pelo menos 6 caracteres.', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showFormMessage(messageElement, 'As senhas não coincidem.', 'error');
        return;
    }
    
    const result = userSystem.registerUser(name, email, password);
    
    if (result.success) {
        showFormMessage(messageElement, result.message, 'success');
        // Auto-login após cadastro
        setTimeout(() => {
            const loginResult = userSystem.loginUser(email, password);
            if (loginResult.success) {
                userSystem.updateUI();
                closeLoginModal();
                toastSystem.show(`Cadastro realizado! Bem-vindo(a), ${name}!`, 'success');
            }
        }, 1500);
    } else {
        showFormMessage(messageElement, result.message, 'error');
    }
}

function showFormMessage(element, message, type) {
    element.innerHTML = message;
    element.className = `form-message ${type}`;
}

function handleLogout() {
    userSystem.logoutUser();
    userSystem.updateUI();
    toastSystem.show('Logout realizado com sucesso!', 'info');
}

// [ADICIONADO - NAVEGAÇÃO MATÉRIAS] Função para navegar para quizzes a partir dos cards de matérias
function navigateToSubjectQuizzes(subject) {
    const subjectNames = {
        'portugues': 'Português',
        'matematica': 'Matemática',
        'ciencias': 'Ciências',
        'historia': 'História',
        'geografia': 'Geografia',
        'redacao': 'Redação'
    };
    
    // Mostrar seção de quizzes
    showSection('quizzes');
    updateNavigationActive('quizzes');
    
    // Rolar para o quiz correspondente
    setTimeout(() => {
        const quizCard = document.querySelector(`.quiz-card[data-quiz="${subject}"]`);
        if (quizCard) {
            quizCard.scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
            });
            
            // Efeito visual de destaque
            quizCard.style.transform = 'scale(1.05)';
            quizCard.style.boxShadow = '0 10px 25px rgba(74, 108, 247, 0.3)';
            quizCard.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
                quizCard.style.transform = 'scale(1)';
                quizCard.style.boxShadow = '';
            }, 1500);
            
            toastSystem.show(`Quiz de ${subjectNames[subject]} selecionado!`, 'info', 3000);
        }
    }, 500);
}

// [ADICIONADO - LOGO CLICK] Função para voltar ao topo ao clicar no logo
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    // Mostrar seção home se não estiver visível
    if (currentState.currentSection !== 'home') {
        showSection('home');
        updateNavigationActive('home');
    }
}

// Inicialização do aplicativo
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadProgress();
    updateProgressDisplay();
    userSystem.init(); // [ADICIONADO - LOGIN CADASTRO] Inicializar sistema de usuários
});

// Inicializar aplicativo
function initializeApp() {
    const savedProgress = localStorage.getItem('estudaMaisProgress');
    if (savedProgress) {
        Object.assign(appData, JSON.parse(savedProgress));
    }
    
    const savedState = localStorage.getItem('estudaMaisState');
    if (savedState) {
        Object.assign(currentState, JSON.parse(savedState));
    }
    
    showSection('home');
}

// Configurar event listeners
function setupEventListeners() {
    // [ADICIONADO - LOGIN CADASTRO] Event listeners do sistema de login
    document.getElementById('login-btn').addEventListener('click', openLoginModal);
    document.getElementById('mobile-login-btn').addEventListener('click', openLoginModal);
    
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeLoginModal);
    });
    
    document.getElementById('login-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeLoginModal();
        }
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.getAttribute('data-tab'));
        });
    });
    
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    
    // [ADICIONADO - LOGO CLICK] Event listener para o logo
    document.getElementById('home-logo').addEventListener('click', scrollToTop);
    
    // [ADICIONADO - NAVEGAÇÃO MATÉRIAS] Event listeners para os cards de matérias
    document.querySelectorAll('.subject-card').forEach(card => {
        card.addEventListener('click', function() {
            const subject = this.getAttribute('data-subject');
            navigateToSubjectQuizzes(subject);
        });
    });

    // Navegação principal
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            showSection(sectionId);
            
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Links do rodapé
    document.querySelectorAll('.footer-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href');
            
            if (target === '#help') {
                openModal('help');
            } else if (target === '#contact') {
                openModal('contact');
            } else if (target.startsWith('mailto:')) {
                window.location.href = target;
            } else {
                const sectionId = target.substring(1);
                showSection(sectionId);
                
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                document.querySelector(`a[href="${target}"]`).classList.add('active');
            }
        });
    });

    // Menu mobile - FUNÇÃO ATUALIZADA
    document.querySelector('.mobile-menu').addEventListener('click', function() {
        const nav = document.querySelector('.nav');
        const body = document.querySelector('body');
        
        if (nav.style.display === 'flex' || nav.classList.contains('active')) {
            nav.style.display = 'none';
            nav.classList.remove('active');
            body.style.overflow = 'auto';
        } else {
            nav.style.display = 'flex';
            nav.classList.add('active');
            body.style.overflow = 'hidden';
        }
    });

    // Fechar menu ao clicar em um link (apenas mobile)
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                const nav = document.querySelector('.nav');
                const body = document.querySelector('body');
                nav.style.display = 'none';
                nav.classList.remove('active');
                body.style.overflow = 'auto';
            }
        });
    });

    // Fechar menu ao redimensionar a janela para tamanho maior
    window.addEventListener('resize', function() {
        const nav = document.querySelector('.nav');
        const body = document.querySelector('body');
        
        if (window.innerWidth > 768) {
            nav.style.display = 'flex';
            nav.classList.remove('active');
            body.style.overflow = 'auto';
        } else {
            nav.style.display = 'none';
            nav.classList.remove('active');
        }
    });

    // Botão "Começar a Estudar"
    document.querySelector('.start-studying').addEventListener('click', function() {
        showSection('subjects');
        updateNavigationActive('subjects');
    });

    // Acessar matéria - FUNCIONANDO
    document.querySelectorAll('.access-subject').forEach(button => {
        button.addEventListener('click', function() {
            const subjectCard = this.closest('.subject-card');
            const subject = subjectCard.getAttribute('data-subject');
            openSubjectPanel(subject);
        });
    });

    // Fechar painel de matéria
    document.querySelector('.btn-close').addEventListener('click', function() {
        document.getElementById('subject-panel').classList.add('hidden');
    });

    // Opções do painel de matéria - FUNCIONANDO
    document.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', function() {
            const option = this.getAttribute('data-option');
            const subject = document.getElementById('panel-title').textContent.toLowerCase();
            
            document.getElementById('subject-panel').classList.add('hidden');
            
            switch(option) {
                case 'quizzes':
                    showSection('quizzes');
                    updateNavigationActive('quizzes');
                    break;
                case 'simulated':
                    showSection('simulated');
                    updateNavigationActive('simulated');
                    break;
                case 'flashcards':
                    showSection('flashcards');
                    updateNavigationActive('flashcards');
                    break;
            }
        });
    });

    // Quizzes
    document.querySelectorAll('.start-quiz').forEach(button => {
        button.addEventListener('click', function() {
            const quizCard = this.closest('.quiz-card');
            const quizSubject = quizCard.getAttribute('data-quiz');
            startQuiz(quizSubject);
        });
    });

    document.getElementById('next-question').addEventListener('click', nextQuestion);
    document.getElementById('prev-question').addEventListener('click', prevQuestion);
    document.getElementById('finish-quiz').addEventListener('click', finishQuiz);
    document.getElementById('review-quiz').addEventListener('click', reviewQuiz);
    document.getElementById('new-quiz').addEventListener('click', newQuiz);

    // Simulado
    document.getElementById('start-simulated').addEventListener('click', startSimulated);
    document.getElementById('next-simulated').addEventListener('click', nextSimulatedQuestion);
    document.getElementById('prev-simulated').addEventListener('click', prevSimulatedQuestion);
    document.getElementById('finish-simulated').addEventListener('click', finishSimulated);
    document.getElementById('review-simulated').addEventListener('click', reviewSimulated);
    document.getElementById('new-simulated').addEventListener('click', newSimulated);

    // Flashcards
    document.querySelectorAll('.start-flashcards').forEach(button => {
        button.addEventListener('click', function() {
            const flashcardSet = this.closest('.flashcard-set');
            const subject = flashcardSet.getAttribute('data-set');
            startFlashcards(subject);
        });
    });

    document.getElementById('flashcard').addEventListener('click', flipFlashcard);
    document.getElementById('next-flashcard').addEventListener('click', nextFlashcard);
    document.getElementById('review-again').addEventListener('click', reviewFlashcardsAgain);
    document.getElementById('new-flashcards').addEventListener('click', newFlashcards);

    // Redação
    document.getElementById('essay-text').addEventListener('input', updateEssayLineCount);
    document.getElementById('clear-essay').addEventListener('click', clearEssay);
    document.getElementById('correct-essay').addEventListener('click', correctEssay);
    document.getElementById('send-to-ai').addEventListener('click', sendToAI);
    document.getElementById('new-essay').addEventListener('click', newEssay);

    // IA - FUNÇÕES ATUALIZADAS
    document.getElementById('clear-chat').addEventListener('click', clearChat);
    document.getElementById('send-message').addEventListener('click', sendMessage);
    document.getElementById('chat-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Modais
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', closeModal);
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    });

    document.getElementById('contact-form').addEventListener('submit', function(e) {
        e.preventDefault();
        submitContactForm();
    });
}

// [ADICIONADO - LOGIN CADASTRO] Atualizar event listener do botão de login para logout quando logado
function updateLoginButtonBehavior() {
    const loginBtn = document.getElementById('login-btn');
    const mobileLoginBtn = document.getElementById('mobile-login-btn');
    
    if (userSystem.currentUser) {
        // Substituir evento de click para logout
        loginBtn.replaceWith(loginBtn.cloneNode(true));
        document.getElementById('login-btn').addEventListener('click', handleLogout);
        
        if (mobileLoginBtn) {
            mobileLoginBtn.replaceWith(mobileLoginBtn.cloneNode(true));
            document.getElementById('mobile-login-btn').addEventListener('click', handleLogout);
        }
    } else {
        // Manover evento original de login
        loginBtn.replaceWith(loginBtn.cloneNode(true));
        document.getElementById('login-btn').addEventListener('click', openLoginModal);
        
        if (mobileLoginBtn) {
            mobileLoginBtn.replaceWith(mobileLoginBtn.cloneNode(true));
            document.getElementById('mobile-login-btn').addEventListener('click', openLoginModal);
        }
    }
}

// Funções de navegação
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    currentState.currentSection = sectionId;
    saveState();
}

function updateNavigationActive(sectionId) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`a[href="#${sectionId}"]`).classList.add('active');
}

// Funções do painel de matérias - FUNCIONANDO
function openSubjectPanel(subject) {
    const panel = document.getElementById('subject-panel');
    const title = document.getElementById('panel-title');
    
    title.textContent = appData.subjectNames[subject];
    panel.classList.remove('hidden');
}

// Funções dos modais
function openModal(modalId) {
    document.getElementById(`${modalId}-modal`).classList.remove('hidden');
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
}

function submitContactForm() {
    const name = document.getElementById('contact-name').value;
    alert(`Obrigado, ${name}! Sua mensagem foi enviada com sucesso.`);
    document.getElementById('contact-form').reset();
    closeModal();
}

// Funções
function startQuiz(subject) {
    currentState.currentQuiz = subject;
    currentState.currentQuizIndex = 0;
    currentState.quizAnswers = [];
    currentState.quizScore = 0;
    
    document.querySelector('.quiz-selection').classList.add('hidden');
    document.getElementById('active-quiz').classList.remove('hidden');
    document.getElementById('quiz-title').textContent = `Quiz de ${appData.subjectNames[subject]}`;
    
    showQuestion(currentState.currentQuizIndex);
}

function showQuestion(index) {
    const quiz = quizData[currentState.currentQuiz];
    const question = quiz[index];
    
    document.getElementById('question-text').textContent = question.question;
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    // Limpar botão de voltar aos resultados se existir
    const backButton = document.getElementById('back-to-results');
    if (backButton) {
        backButton.remove();
    }
    
    question.options.forEach((option, i) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        if (currentState.quizAnswers[index] === i) {
            optionElement.classList.add('selected');
        }
        
        optionElement.innerHTML = `
            <div class="option-marker">${String.fromCharCode(65 + i)}</div>
            <div class="option-text">${option}</div>
        `;
        
        optionElement.addEventListener('click', () => selectOption(i));
        optionsContainer.appendChild(optionElement);
    });
    
    updateQuizProgress();
    document.getElementById('prev-question').disabled = index === 0;
    document.getElementById('next-question').classList.toggle('hidden', index === quiz.length - 1);
    document.getElementById('finish-quiz').classList.toggle('hidden', index !== quiz.length - 1);
}

function selectOption(optionIndex) {
    currentState.quizAnswers[currentState.currentQuizIndex] = optionIndex;
    
    const options = document.querySelectorAll('.option');
    options.forEach((option, i) => {
        option.classList.toggle('selected', i === optionIndex);
    });
    
    saveState();
}

function nextQuestion() {
    if (currentState.currentQuizIndex < quizData[currentState.currentQuiz].length - 1) {
        currentState.currentQuizIndex++;
        showQuestion(currentState.currentQuizIndex);
    }
}

function prevQuestion() {
    if (currentState.currentQuizIndex > 0) {
        currentState.currentQuizIndex--;
        showQuestion(currentState.currentQuizIndex);
    }
}

function updateQuizProgress() {
    const quiz = quizData[currentState.currentQuiz];
    const progress = ((currentState.currentQuizIndex + 1) / quiz.length) * 100;
    document.getElementById('quiz-progress-bar').style.width = `${progress}%`;
    document.getElementById('quiz-progress-text').textContent = `${currentState.currentQuizIndex + 1}/${quiz.length}`;
}

function finishQuiz() {
    const quiz = quizData[currentState.currentQuiz];
    let correct = 0;
    
    quiz.forEach((question, index) => {
        if (currentState.quizAnswers[index] === question.correct) {
            correct++;
        }
    });
    
    currentState.quizScore = correct;
    updateSubjectProgress(currentState.currentQuiz, (correct / quiz.length) * 100);
    appData.quizzesCompleted++;
    
    showQuizResult(correct, quiz.length);
    saveProgress();
    saveState();
}

function showQuizResult(correct, total) {
    document.getElementById('active-quiz').classList.add('hidden');
    document.getElementById('quiz-result').classList.remove('hidden');
    
    const percentage = Math.round((correct / total) * 100);
    document.getElementById('score-percent').textContent = `${percentage}%`;
    document.getElementById('correct-answers').textContent = correct;
    document.getElementById('wrong-answers').textContent = total - correct;
    
    let performance = '';
    let feedback = '';
    
    if (percentage >= 90) {
        performance = 'Excelente';
        feedback = 'Parabéns! Seu desempenho foi excelente. Continue assim!';
    } else if (percentage >= 70) {
        performance = 'Bom';
        feedback = 'Bom trabalho! Seu desempenho foi satisfatório.';
    } else if (percentage >= 50) {
        performance = 'Regular';
        feedback = 'Seu desempenho foi regular. Recomendo revisar o conteúdo.';
    } else {
        performance = 'Ruim';
        feedback = 'Seu desempenho foi abaixo do esperado. Estude mais o conteúdo.';
    }
    
    document.getElementById('performance').textContent = performance;
    document.getElementById('feedback-text').textContent = feedback;
    addActivity(`Quiz de ${appData.subjectNames[currentState.currentQuiz]} concluído: ${percentage}%`);
}

function reviewQuiz() {
    document.getElementById('quiz-result').classList.add('hidden');
    document.getElementById('active-quiz').classList.remove('hidden');
    
    // Resetar para primeira questão
    currentState.currentQuizIndex = 0;
    
    // Mostrar modo revisão
    showQuestionForReview(currentState.currentQuizIndex);
}

function newQuiz() {
    document.getElementById('quiz-result').classList.add('hidden');
    document.querySelector('.quiz-selection').classList.remove('hidden');
}

// Funções do simulado
function startSimulated() {
    currentState.currentSimulated = [...simulatedData];
    currentState.currentSimulatedIndex = 0;
    currentState.simulatedAnswers = [];
    currentState.simulatedScore = 0;
    currentState.simulatedTime = 3600;
    
    document.querySelector('.simulated-info').classList.add('hidden');
    document.querySelector('.simulated-actions').classList.add('hidden');
    document.getElementById('active-simulated').classList.remove('hidden');
    
    startSimulatedTimer();
    showSimulatedQuestion(currentState.currentSimulatedIndex);
}

function showSimulatedQuestion(index) {
    const question = currentState.currentSimulated[index];
    document.getElementById('simulated-question-text').textContent = question.question;
    
    const optionsContainer = document.getElementById('simulated-options-container');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, i) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        if (currentState.simulatedAnswers[index] === i) {
            optionElement.classList.add('selected');
        }
        
        optionElement.innerHTML = `
            <div class="option-marker">${String.fromCharCode(65 + i)}</div>
            <div class="option-text">${option}</div>
        `;
        
        optionElement.addEventListener('click', () => selectSimulatedOption(i));
        optionsContainer.appendChild(optionElement);
    });
    
    updateSimulatedProgress();
    document.getElementById('prev-simulated').disabled = index === 0;
    document.getElementById('next-simulated').classList.toggle('hidden', index === currentState.currentSimulated.length - 1);
    document.getElementById('finish-simulated').classList.toggle('hidden', index !== currentState.currentSimulated.length - 1);
}

function selectSimulatedOption(optionIndex) {
    currentState.simulatedAnswers[currentState.currentSimulatedIndex] = optionIndex;
    
    const options = document.querySelectorAll('#simulated-options-container .option');
    options.forEach((option, i) => {
        option.classList.toggle('selected', i === optionIndex);
    });
    
    saveState();
}

function nextSimulatedQuestion() {
    if (currentState.currentSimulatedIndex < currentState.currentSimulated.length - 1) {
        currentState.currentSimulatedIndex++;
        showSimulatedQuestion(currentState.currentSimulatedIndex);
    }
}

function prevSimulatedQuestion() {
    if (currentState.currentSimulatedIndex > 0) {
        currentState.currentSimulatedIndex--;
        showSimulatedQuestion(currentState.currentSimulatedIndex);
    }
}

function updateSimulatedProgress() {
    const progress = ((currentState.currentSimulatedIndex + 1) / currentState.currentSimulated.length) * 100;
    document.getElementById('simulated-progress-bar').style.width = `${progress}%`;
    document.getElementById('simulated-progress-text').textContent = `${currentState.currentSimulatedIndex + 1}/${currentState.currentSimulated.length}`;
}

function startSimulatedTimer() {
    if (currentState.simulatedTimer) {
        clearInterval(currentState.simulatedTimer);
    }
    
    currentState.simulatedTimer = setInterval(() => {
        currentState.simulatedTime--;
        
        const minutes = Math.floor(currentState.simulatedTime / 60);
        const seconds = currentState.simulatedTime % 60;
        document.getElementById('simulated-timer').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (currentState.simulatedTime <= 0) {
            clearInterval(currentState.simulatedTimer);
            finishSimulated();
        }
        
        saveState();
    }, 1000);
}

function finishSimulated() {
    if (currentState.simulatedTimer) {
        clearInterval(currentState.simulatedTimer);
        currentState.simulatedTimer = null;
    }
    
    let correct = 0;
    const subjectScores = {};
    
    currentState.currentSimulated.forEach((question, index) => {
        const subject = question.subject;
        
        if (!subjectScores[subject]) {
            subjectScores[subject] = { correct: 0, total: 0 };
        }
        
        subjectScores[subject].total++;
        
        if (currentState.simulatedAnswers[index] === question.correct) {
            correct++;
            subjectScores[subject].correct++;
        }
    });
    
    currentState.simulatedScore = Math.round((correct / currentState.currentSimulated.length) * 1000);
    appData.simulatedCompleted++;
    
    showSimulatedResult(correct, subjectScores);
    saveProgress();
    saveState();
}

function showSimulatedResult(correct, subjectScores) {
    document.getElementById('active-simulated').classList.add('hidden');
    document.getElementById('simulated-result').classList.remove('hidden');
    
    const total = currentState.currentSimulated.length;
    document.getElementById('simulated-score').textContent = currentState.simulatedScore;
    document.getElementById('simulated-correct').textContent = correct;
    document.getElementById('simulated-wrong').textContent = total - correct;
    
    const timeSpent = 3600 - currentState.simulatedTime;
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;
    document.getElementById('simulated-time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const breakdownList = document.getElementById('subject-breakdown');
    breakdownList.innerHTML = '';
    
    Object.keys(subjectScores).forEach(subject => {
        const score = subjectScores[subject];
        const percentage = Math.round((score.correct / score.total) * 100);
        
        const item = document.createElement('div');
        item.className = 'breakdown-item';
        item.innerHTML = `
            <div class="subject">
                <i class="fas fa-${getSubjectIcon(subject)}"></i>
                <span>${appData.subjectNames[subject]}</span>
            </div>
            <div class="score">${score.correct}/${score.total} (${percentage}%)</div>
        `;
        
        breakdownList.appendChild(item);
        updateSubjectProgress(subject, percentage);
    });
    
    let feedback = '';
    const percentage = (correct / total) * 100;
    
    if (percentage >= 80) {
        feedback = 'Excelente desempenho! Você demonstrou domínio da maioria dos conteúdos. Continue assim!';
    } else if (percentage >= 60) {
        feedback = 'Bom desempenho! Você tem uma base sólida, mas pode melhorar em algumas áreas.';
    } else if (percentage >= 40) {
        feedback = 'Desempenho regular. Identifique suas dificuldades e dedique mais tempo aos estudos.';
    } else {
        feedback = 'Desempenho abaixo do esperado. É importante revisar os conteúdos e praticar mais.';
    }
    
    document.getElementById('simulated-feedback').textContent = feedback;
    addActivity(`Simulado concluído: ${currentState.simulatedScore} pontos`);
}

function reviewSimulated() {
    document.getElementById('simulated-result').classList.add('hidden');
    document.getElementById('active-simulated').classList.remove('hidden');
}

function newSimulated() {
    document.getElementById('simulated-result').classList.add('hidden');
    document.querySelector('.simulated-info').classList.remove('hidden');
    document.querySelector('.simulated-actions').classList.remove('hidden');
}

// Funções dos flashcards
function startFlashcards(subject) {
    currentState.currentFlashcards = subject;
    currentState.currentFlashcardIndex = 0;
    currentState.flashcardsLearned = [];
    currentState.flashcardsToReview = [];
    
    shuffleArray(flashcardData[subject]);
    
    document.querySelector('.flashcards-selection').classList.add('hidden');
    document.getElementById('active-flashcards').classList.remove('hidden');
    document.getElementById('flashcards-title').textContent = `Flashcards de ${appData.subjectNames[subject]}`;
    
    showFlashcard(currentState.currentFlashcardIndex);
}

function showFlashcard(index) {
    const flashcards = flashcardData[currentState.currentFlashcards];
    const flashcard = flashcards[index];
    
    document.getElementById('flashcard').classList.remove('flipped');
    document.getElementById('flashcard-question').textContent = flashcard.question;
    document.getElementById('flashcard-answer').textContent = flashcard.answer;
    document.getElementById('flashcards-progress-text').textContent = `${index + 1}/${flashcards.length}`;
    
    const isLearned = currentState.flashcardsLearned.includes(index);
    const isToReview = currentState.flashcardsToReview.includes(index);
}

function flipFlashcard() {
    this.classList.toggle('flipped');
}

function nextFlashcard() {
    const flashcards = flashcardData[currentState.currentFlashcards];
    
    if (currentState.currentFlashcardIndex < flashcards.length - 1) {
        currentState.currentFlashcardIndex++;
        showFlashcard(currentState.currentFlashcardIndex);
    } else {
        finishFlashcards();
    }
}

function finishFlashcards() {
    const flashcards = flashcardData[currentState.currentFlashcards];
    appData.flashcardsStudied += flashcards.length;
    
    const progress = Math.round((currentState.flashcardsLearned.length / flashcards.length) * 100);
    updateSubjectProgress(currentState.currentFlashcards, progress);
    
    document.getElementById('active-flashcards').classList.add('hidden');
    document.getElementById('flashcards-result').classList.remove('hidden');
    
    document.getElementById('learned-count').textContent = currentState.flashcardsLearned.length;
    document.getElementById('review-count').textContent = currentState.flashcardsToReview.length;
    document.getElementById('flashcards-progress').textContent = `${progress}%`;
    
    addActivity(`Flashcards de ${appData.subjectNames[currentState.currentFlashcards]} estudados`);
    saveProgress();
    saveState();
}

function reviewFlashcardsAgain() {
    const toReview = currentState.flashcardsToReview;
    
    if (toReview.length > 0) {
        const reviewFlashcards = toReview.map(index => flashcardData[currentState.currentFlashcards][index]);
        flashcardData[currentState.currentFlashcards] = reviewFlashcards;
        
        currentState.currentFlashcardIndex = 0;
        currentState.flashcardsLearned = [];
        currentState.flashcardsToReview = [];
        
        document.getElementById('flashcards-result').classList.add('hidden');
        document.getElementById('active-flashcards').classList.remove('hidden');
        showFlashcard(currentState.currentFlashcardIndex);
    } else {
        alert('Não há flashcards para revisar!');
    }
}

function newFlashcards() {
    document.getElementById('flashcards-result').classList.add('hidden');
    document.querySelector('.flashcards-selection').classList.remove('hidden');
}

// Funções de redação
function updateEssayLineCount() {
    const text = document.getElementById('essay-text').value;
    const lines = text.split('\n').length;
    document.getElementById('line-count').textContent = lines;
    currentState.essayText = text;
    saveState();
}

function clearEssay() {
    if (confirm('Tem certeza que deseja limpar a redação? Todo o texto será perdido.')) {
        document.getElementById('essay-text').value = '';
        currentState.essayText = '';
        updateEssayLineCount();
        saveState();
    }
}

function correctEssay() {
    const text = document.getElementById('essay-text').value.trim();
    
    if (text.length < 100) {
        alert('Sua redação está muito curta. Escreva pelo menos 100 caracteres para receber uma correção.');
        return;
    }
    
    const score = simulateEssayCorrection(text);
    const feedback = generateDetailedEssayFeedback(score, text);
    
    appData.essaysCorrected++;
    showEssayResult(score, feedback);
    saveProgress();
    addActivity(`Redação corrigida: ${score} pontos`);
}

// FUNÇÃO DE ENVIO PARA IA (REDAÇÃO) - ATUALIZADA
async function sendToAI() {
    const text = document.getElementById('essay-text').value.trim();
    
    if (text.length < 100) {
        alert('Sua redação está muito curta. Escreva pelo menos 100 caracteres para enviar para a IA.');
        return;
    }
    
    // Adiciona mensagem no chat
    currentState.chatMessages.push({
        role: 'user',
        content: `Por favor, corrija minha redação sobre "Os desafios da educação no Brasil no século XXI":\n\n${text}`
    });
    
    updateChatDisplay();
    
    // Usa a função de IA real
    await getAIResponse(`Por favor, corrija esta redação sobre "Os desafios da educação no Brasil no século XXI":\n\n${text}`);
    
    // Leva o usuário para a aba da IA
    showSection('ai');
    updateNavigationActive('ai');
}

function simulateEssayCorrection(text) {
    let score = 500;
    const wordCount = text.split(/\s+/).length;
    const lineCount = text.split('\n').length;
    const hasIntroduction = /introdução|inicio|primeiro|inicial/i.test(text);
    const hasDevelopment = /desenvolvimento|meio|argumento|exemplo/i.test(text);
    const hasConclusion = /conclusão|fim|final|portanto|dessa forma/i.test(text);
    const hasProposal = /solução|proposta|medida|intervenção/i.test(text);
    
    if (wordCount > 200) score += 100;
    if (wordCount > 400) score += 100;
    if (lineCount >= 20) score += 50;
    if (hasIntroduction) score += 50;
    if (hasDevelopment) score += 100;
    if (hasConclusion) score += 50;
    if (hasProposal) score += 100;
    
    score += Math.floor(Math.random() * 101) - 50;
    score = Math.max(0, Math.min(1000, score));
    
    return score;
}

function generateDetailedEssayFeedback(score, text) {
    let feedbackHTML = '';
    
    feedbackHTML += `
        <div class="feedback-section strengths">
            <h5>Pontos Fortes</h5>
            <ul>
                <li>Você demonstrou boa compreensão do tema proposto</li>
                <li>A estrutura geral do texto está adequada</li>
                <li>Utilizou vocabulário variado e apropriado</li>
    `;
    
    if (text.length > 300) {
        feedbackHTML += `<li>Desenvolveu bem os argumentos com exemplos relevantes</li>`;
    }
    
    if (/conclusão|portanto|assim|dessa forma/i.test(text)) {
        feedbackHTML += `<li>Conseguiu finalizar o texto de forma coerente</li>`;
    }
    
    feedbackHTML += `</ul></div>`;
    
    feedbackHTML += `
        <div class="feedback-section improvements">
            <h5>Pontos de Melhoria</h5>
            <ul>
    `;
    
    if (text.length < 250) {
        feedbackHTML += `<li>Desenvolva mais seus argumentos para atingir a quantidade ideal de linhas</li>`;
    }
    
    if (!/proposta|solução|intervenção/i.test(text)) {
        feedbackHTML += `<li>Inclua uma proposta de intervenção mais clara e detalhada</li>`;
    }
    
    if (text.split('.').length < 10) {
        feedbackHTML += `<li>Utilize mais períodos curtos para melhorar a clareza do texto</li>`;
    }
    
    feedbackHTML += `
                <li>Revise a concordância verbal e nominal para evitar deslizes</li>
                <li>Amplie o repertório sociocultural com mais referências</li>
            </ul>
        </div>
    `;
    
    feedbackHTML += `
        <div class="feedback-section suggestions">
            <h5>Sugestões</h5>
            <ul>
                <li>Pratique a estrutura dissertativa-argumentativa com mais frequência</li>
                <li>Estude casos de atualidades para enriquecer seus argumentos</li>
                <li>Leia redações nota 1000 para se familiarizar com o padrão esperado</li>
                <li>Faça um rascunho antes de escrever o texto definitivo</li>
            </ul>
        </div>
    `;
    
    return feedbackHTML;
}

function showEssayResult(score, feedback) {
    document.querySelector('.essay-container').classList.add('hidden');
    document.getElementById('essay-result').classList.remove('hidden');
    
    document.getElementById('essay-score').textContent = score;
    
    const comp1 = Math.min(200, Math.floor(score * 0.2 + Math.random() * 40));
    const comp2 = Math.min(200, Math.floor(score * 0.2 + Math.random() * 40));
    const comp3 = Math.min(200, Math.floor(score * 0.2 + Math.random() * 40));
    const comp4 = Math.min(200, Math.floor(score * 0.2 + Math.random() * 40));
    const comp5 = Math.min(200, Math.floor(score * 0.2 + Math.random() * 40));
    
    const total = comp1 + comp2 + comp3 + comp4 + comp5;
    const adjustment = score - total;
    
    const compScores = [comp1, comp2, comp3, comp4, comp5];
    const adjustedScores = compScores.map(s => Math.min(200, Math.max(0, s + Math.floor(adjustment / 5))));
    
    for (let i = 0; i < 5; i++) {
        const progress = (adjustedScores[i] / 200) * 100;
        document.getElementById(`comp${i+1}-progress`).style.width = `${progress}%`;
        document.getElementById(`comp${i+1}-score`).textContent = adjustedScores[i];
    }
    
    document.getElementById('feedback-content').innerHTML = feedback;
}

function newEssay() {
    document.getElementById('essay-result').classList.add('hidden');
    document.querySelector('.essay-container').classList.remove('hidden');
}

// FUNÇÕES DO CHAT IA - ATUALIZADAS
function clearChat() {
    if (confirm('Tem certeza que deseja limpar o histórico do chat?')) {
        currentState.chatMessages = [
            {
                role: 'ai',
                content: 'Olá! Sou seu assistente de estudos do Estuda Mais. Posso ajudar com dúvidas sobre qualquer matéria ou corrigir sua redação! Como posso ajudá-lo hoje?'
            }
        ];
        
        updateChatDisplay();
        saveState();
    }
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    currentState.chatMessages.push({
        role: 'user',
        content: message
    });
    
    input.value = '';
    updateChatDisplay();
    
    // Usa a função de IA real
    getAIResponse(message);
    saveState();
}

function updateChatDisplay() {
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.innerHTML = '';
    
    currentState.chatMessages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.role}-message`;
        
        if (message.isTyping) {
            messageElement.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <p><i>${message.content}</i></p>
                </div>
            `;
        } else {
            messageElement.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-${message.role === 'user' ? 'user' : 'robot'}"></i>
                </div>
                <div class="message-content">
                    <p>${message.content}</p>
                </div>
            `;
        }
        
        messagesContainer.appendChild(messageElement);
    });
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Funções de progresso
function updateSubjectProgress(subject, progress) {
    appData.progress[subject] = Math.max(appData.progress[subject], progress);
    
    const totalProgress = Object.values(appData.progress).reduce((sum, p) => sum + p, 0) - appData.progress.overall;
    appData.progress.overall = Math.round(totalProgress / (Object.keys(appData.progress).length - 1));
    
    updateProgressDisplay();
}

function updateProgressDisplay() {
    document.getElementById('overall-progress-text').textContent = `${appData.progress.overall}%`;
    document.getElementById('overall-progress-circle').style.strokeDashoffset = 339.292 - (339.292 * appData.progress.overall / 100);
    
    appData.subjects.forEach(subject => {
        const progress = appData.progress[subject];
        document.querySelector(`.subject-card[data-subject="${subject}"] .progress`).style.width = `${progress}%`;
        document.querySelector(`.subject-card[data-subject="${subject}"] .progress-text span`).textContent = `${progress}%`;
        document.getElementById(`${subject}-progress`).style.width = `${progress}%`;
        document.getElementById(`${subject}-percent`).textContent = `${progress}%`;
    });
    
    document.getElementById('quizzes-completed').textContent = appData.quizzesCompleted;
    document.getElementById('simulated-completed').textContent = appData.simulatedCompleted;
    document.getElementById('flashcards-studied').textContent = appData.flashcardsStudied;
    document.getElementById('essays-corrected').textContent = appData.essaysCorrected;
    
    updateActivityList();
}

function addActivity(description) {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    appData.activity.unshift({
        description,
        time: timeString
    });
    
    if (appData.activity.length > 5) {
        appData.activity = appData.activity.slice(0, 5);
    }
    
    updateActivityList();
    saveProgress();
}

function updateActivityList() {
    const activityList = document.getElementById('activity-list');
    activityList.innerHTML = '';
    
    if (appData.activity.length === 0) {
        activityList.innerHTML = `
            <div class="activity-item">
                <i class="fas fa-info-circle"></i>
                <p>Nenhuma atividade recente</p>
                <span>--</span>
            </div>
        `;
        return;
    }
    
    appData.activity.forEach(activity => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <p>${activity.description}</p>
            <span>${activity.time}</span>
        `;
        activityList.appendChild(item);
    });
}

// Salvamento
function saveProgress() {
    localStorage.setItem('estudaMaisProgress', JSON.stringify(appData));
}

function saveState() {
    localStorage.setItem('estudaMaisState', JSON.stringify(currentState));
}

function loadProgress() {
    const savedProgress = localStorage.getItem('estudaMaisProgress');
    if (savedProgress) {
        Object.assign(appData, JSON.parse(savedProgress));
    }
    
    const savedState = localStorage.getItem('estudaMaisState');
    if (savedState) {
        Object.assign(currentState, JSON.parse(savedState));
    }
}

// Utilitários
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getSubjectIcon(subject) {
    const icons = {
        'portugues': 'book-open',
        'matematica': 'calculator',
        'ciencias': 'flask',
        'historia': 'landmark',
        'geografia': 'globe-americas',
        'redacao': 'pen-fancy'
    };
    return icons[subject] || 'book';
}// [NOVA FUNÇÃO] ADICIONE esta função nova
function showQuestionForReview(index) {
    const quiz = quizData[currentState.currentQuiz];
    const question = quiz[index];
    const userAnswer = currentState.quizAnswers[index];
    const correctAnswer = question.correct;
    
    document.getElementById('question-text').textContent = question.question;
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, i) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        
        // Aplicar classes CSS baseadas nas respostas
        if (i === correctAnswer) {
            optionElement.classList.add('correct'); // Resposta correta - VERDE
        } else if (i === userAnswer && userAnswer !== correctAnswer) {
            optionElement.classList.add('incorrect'); // Resposta errada do usuário - VERMELHO
        }
        
        // Marcar como selecionada se foi a resposta do usuário
        if (i === userAnswer) {
            optionElement.classList.add('selected');
        }
        
        optionElement.innerHTML = `
            <div class="option-marker">${String.fromCharCode(65 + i)}</div>
            <div class="option-text">${option}</div>
        `;
        
        // Adicionar explicação se for a resposta correta
        if (i === correctAnswer) {
            const explanation = document.createElement('div');
            explanation.className = 'explanation';
            explanation.innerHTML = `
                <div class="explanation-content">
                    <strong>Explicação:</strong> ${question.explanation}
                </div>
            `;
            optionElement.appendChild(explanation);
        }
        
        optionsContainer.appendChild(optionElement);
    });
    
    updateQuizProgress();
    
    // Atualizar navegação para modo revisão
    document.getElementById('prev-question').disabled = index === 0;
    document.getElementById('next-question').classList.toggle('hidden', index === quiz.length - 1);
    document.getElementById('finish-quiz').classList.add('hidden');
    
    // Adicionar botão especial para revisão
    if (!document.getElementById('back-to-results')) {
        const backButton = document.createElement('button');
        backButton.id = 'back-to-results';
        backButton.className = 'btn-secondary';
        backButton.textContent = 'Voltar aos Resultados';
        backButton.addEventListener('click', backToResults);
        
        document.querySelector('.quiz-navigation').appendChild(backButton);
    }
}

// [NOVA FUNÇÃO] função nova
function backToResults() {
    document.getElementById('active-quiz').classList.add('hidden');
    document.getElementById('quiz-result').classList.remove('hidden');
}
// [FUNÇÃO NOVA - ADICIONE ISSO]
function showQuestionForReview(index) {
    const quiz = quizData[currentState.currentQuiz];
    const question = quiz[index];
    const userAnswer = currentState.quizAnswers[index];
    const correctAnswer = question.correct;
    
    document.getElementById('question-text').textContent = `Questão ${index + 1}: ${question.question}`;
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, i) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        
        // VERMELHO: Resposta errada do usuário
        if (userAnswer === i && userAnswer !== correctAnswer) {
            optionElement.classList.add('incorrect');
        }
        // VERDE: Resposta correta
        else if (i === correctAnswer) {
            optionElement.classList.add('correct');
        }
        // Cinza: Outras opções
        else {
            optionElement.style.opacity = '0.7';
        }
        
        // Marcar como selecionada se foi a resposta do usuário
        if (i === userAnswer) {
            optionElement.classList.add('selected');
        }
        
        optionElement.innerHTML = `
            <div class="option-marker">${String.fromCharCode(65 + i)}</div>
            <div class="option-text">${option}</div>
        `;
        
        // Adicionar explicação para resposta correta
        if (i === correctAnswer) {
            const explanation = document.createElement('div');
            explanation.className = 'explanation';
            explanation.innerHTML = `
                <div class="explanation-content">
                    <strong>📚 Explicação:</strong> ${question.explanation}
                </div>
            `;
            optionElement.appendChild(explanation);
        }
        
        optionsContainer.appendChild(optionElement);
    });
    
    // Atualizar progresso
    updateQuizProgress();
    
    // Configurar navegação para modo revisão
    document.getElementById('prev-question').disabled = index === 0;
    document.getElementById('next-question').classList.toggle('hidden', index === quiz.length - 1);
    document.getElementById('finish-quiz').classList.add('hidden');
    
    // Adicionar botão para voltar aos resultados
    if (!document.getElementById('back-to-results')) {
        const backButton = document.createElement('button');
        backButton.id = 'back-to-results';
        backButton.className = 'btn-secondary';
        backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Voltar aos Resultados';
        backButton.addEventListener('click', function() {
            document.getElementById('active-quiz').classList.add('hidden');
            document.getElementById('quiz-result').classList.remove('hidden');
        });
        
        document.querySelector('.quiz-navigation').appendChild(backButton);
    }
}function nextQuestion() {
    if (currentState.currentQuizIndex < quizData[currentState.currentQuiz].length - 1) {
        currentState.currentQuizIndex++;
        
        // Verificar se estamos no modo revisão
        const isReviewMode = document.getElementById('back-to-results') !== null;
        if (isReviewMode) {
            showQuestionForReview(currentState.currentQuizIndex);
        } else {
            showQuestion(currentState.currentQuizIndex);
        }
    }
}

function prevQuestion() {
    if (currentState.currentQuizIndex > 0) {
        currentState.currentQuizIndex--;
        
        // Verificar se estamos no modo revisão
        const isReviewMode = document.getElementById('back-to-results') !== null;
        if (isReviewMode) {
            showQuestionForReview(currentState.currentQuizIndex);
        } else {
            showQuestion(currentState.currentQuizIndex);
        }
    }
}