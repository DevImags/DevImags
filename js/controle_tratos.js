// Captura dos elementos do HTML usando os IDs corretos
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('upload-excel');

// VARIÁVEIS GLOBAIS DE CONTROLE DOS FILTROS
let dadosOriginaisPlanilha = [];
let propriedadesSelecionadas = new Set();

// Eventos de clique e arrastar arquivo para Upload
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('hover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('hover'));

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('hover');
    const arquivos = e.dataTransfer.files;
    if (arquivos.length) processarPlanilha(arquivos[0]);
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) processarPlanilha(e.target.files[0]);
});

// FUNÇÃO: Filtros com seleção única por clique (e Ctrl + Clique para múltiplas)
function gerarFiltrosLaterais(dados) {
    const containerFiltros = document.getElementById('lista-propriedades-filtros');
    if (!containerFiltros) return;
    containerFiltros.innerHTML = '';
    const propriedadesUnicas = new Set();

    dados.forEach(row => {
        const codProp = row['Propriedade'] ? row['Propriedade'].toString().trim() : '';
        const fazenda = row['Fundo Agrícola'] || row['Fundo Agricola'];
        if (fazenda) {
            const nomeFazendaTratado = fazenda.toString().trim();
            propriedadesUnicas.add(codProp ? `${codProp} - ${nomeFazendaTratado}` : nomeFazendaTratado);
        }
    });

    const listaOrdenada = Array.from(propriedadesUnicas).sort((a, b) => {
        const numA = parseInt(a.split(' - ')[0]) || 0;
        const numB = parseInt(b.split(' - ')[0]) || 0;
        if (numA !== numB) return numA - numB;
        return a.localeCompare(b);
    });

    propriedadesSelecionadas.clear();
    listaOrdenada.forEach(p => propriedadesSelecionadas.add(p));

    function atualizarVisualCheckboxes() {
        containerFiltros.querySelectorAll('.filtro-opcao').forEach(div => {
            const propNome = div.getAttribute('data-propriedade');
            const chk = div.querySelector('.chk-fazenda');
            if (chk) chk.checked = propriedadesSelecionadas.has(propNome);
        });
    }

    listaOrdenada.forEach(propriedade => {
        const divOpcao = document.createElement('div');
        divOpcao.className = 'filtro-opcao';
        divOpcao.setAttribute('data-propriedade', propriedade);
        divOpcao.style.display = 'flex';
        divOpcao.style.alignItems = 'center';
        divOpcao.style.marginBottom = '6px';
        divOpcao.style.cursor = 'pointer';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.className = 'chk-fazenda';
        checkbox.style.marginRight = '8px';
        checkbox.style.pointerEvents = 'none';

        const label = document.createElement('label');
        label.innerText = propriedade;
        label.style.cursor = 'pointer';

        divOpcao.appendChild(checkbox);
        divOpcao.appendChild(label);
        containerFiltros.appendChild(divOpcao);

        divOpcao.addEventListener('click', (e) => {
            const pressionouCtrl = e.ctrlKey || e.metaKey;

            if (pressionouCtrl) {
                if (propriedadesSelecionadas.has(propriedade)) {
                    propriedadesSelecionadas.delete(propriedade);
                } else {
                    propriedadesSelecionadas.add(propriedade);
                }
            } else {
                propriedadesSelecionadas.clear();
                propriedadesSelecionadas.add(propriedade);
            }

            atualizarVisualCheckboxes();
            renderizarKanban(dadosOriginaisPlanilha);
        });
    });

    const btnMarcarTodos = document.getElementById('btn-marcar-todos');
    const btnDesmarcarTodos = document.getElementById('btn-desmarcar-todos');

    if (btnMarcarTodos) {
        const novoBtnMarcar = btnMarcarTodos.cloneNode(true);
        btnMarcarTodos.parentNode.replaceChild(novoBtnMarcar, btnMarcarTodos);
        novoBtnMarcar.addEventListener('click', () => {
            listaOrdenada.forEach(p => propriedadesSelecionadas.add(p));
            atualizarVisualCheckboxes();
            renderizarKanban(dadosOriginaisPlanilha);
        });
    }
    if (btnDesmarcarTodos) {
        const novoBtnDesmarcar = btnDesmarcarTodos.cloneNode(true);
        btnDesmarcarTodos.parentNode.replaceChild(novoBtnDesmarcar, btnDesmarcarTodos);
        novoBtnDesmarcar.addEventListener('click', () => {
            propriedadesSelecionadas.clear();
            atualizarVisualCheckboxes();
            renderizarKanban(dadosOriginaisPlanilha);
        });
    }
}

// FUNÇÃO PRINCIPAL: Renderização do Kanban
function renderizarKanban(dados) {
    const colSemPlantio = document.getElementById('col-sem-plantio');
    const colPendentes = document.getElementById('col-pendentes');
    const colAndamento = document.getElementById('col-andamento');
    const colRealizadas = document.getElementById('col-realizadas');

    if (colSemPlantio) colSemPlantio.innerHTML = '';
    if (colPendentes) colPendentes.innerHTML = '';
    if (colAndamento) colAndamento.innerHTML = '';
    if (colRealizadas) colRealizadas.innerHTML = '';

    const operacoesMapeadas = [
        { cod: '2078', desc: 'QUEBRA LOMBOS COM DEFENSIVOS', colDt: 'Dt. 2078' },
        { cod: '2079', desc: 'QUEBRA LOMBO COM DEFENSIVOS - TERCEIROS', colDt: 'Dt.-2079' },
        { cod: '2087', desc: 'APLICACAO DEFENSIVOS (PULVERIZADOR)', colDt: 'Dt.-2087' },
        { cod: '2138', desc: 'APLICACAO DEFENSIVOS AUTOPROPELIDO', colDt: 'Dt.-2138' },
        { cod: '2143', desc: 'QUEBRA LOMBOS SEM DEFENSIVOS', colDt: 'Dt.-2143' }
    ];

    const linesProcessadas = [];

    dados.forEach(row => {
        const codProp = row['Propriedade'] ? row['Propriedade'].toString().trim() : '';
        const fazenda = row['Fundo Agrícola'] || row['Fundo Agricola'];
        if (!fazenda) return;

        const nomeFazendaTratado = fazenda.toString().trim();
        const chaveFiltroPropriedade = codProp ? `${codProp} - ${nomeFazendaTratado}` : nomeFazendaTratado;
        if (!propriedadesSelecionadas.has(chaveFiltroPropriedade)) return;

        const talhao = row['Talhão'] || row['Talhao'] || '-';
        const areaFloat = parseFloat(row['Área Planejada'] || row['Área do Talhão'] || 0) || 0;
        let dataPlantioRaw = row['Encerramento. Plantio'];

        const osPlantio = row['OS-Plantio'] ? row['OS-Plantio'].toString().trim() : '';
        const tipoOperacaoPlantio = row['Operação'] ? row['Operação'].toString().trim() : '';

        const dataPlantioStr = dataPlantioRaw ? dataPlantioRaw.toString().trim() : '';
        if (dataPlantioStr === '' || dataPlantioStr === '-') {
            linesProcessadas.push({
                tipo: 'sem_plantio',
                fazenda: nomeFazendaTratado,
                codPropriedade: codProp,
                talhao: talhao,
                area: areaFloat,
                numOSPlantio: (osPlantio && osPlantio !== '-') ? osPlantio : '-',
                tipoOperacao: (tipoOperacaoPlantio && tipoOperacaoPlantio !== '-') ? tipoOperacaoPlantio : ''
            });
            return;
        }

        const diasAtual = row['Dias Plantado/Colhido'] !== undefined ? row['Dias Plantado/Colhido'] : '0';

        const status2078 = (row['Status da O.S. 2078'] || '').toString().trim();
        const os2078 = (row['OS-2078'] || '').toString().trim();
        const data2078Str = (row['Dt. 2078'] || '').toString().trim();
        const status2078Lower = status2078.toLowerCase();

        const status2079 = (row['Status da O.S. 2079'] || '').toString().trim();
        const os2079 = (row['OS-2079'] || '').toString().trim();
        const b2078EmBranco = (status2078 === '' || status2078 === '-') && (os2078 === '' || os2078 === '-');
        const b2079EmBranco = (status2079 === '' || status2079 === '-') && (os2079 === '' || os2079 === '-');

        const status2087 = (row['Status da O.S. 2087'] || '').toString().trim();
        const os2087 = (row['OS-2087'] || '').toString().trim();
        const status2138 = (row['Status da O.S. 2138'] || '').toString().trim();
        const os2138 = (row['OS-2138'] || '').toString().trim();
        const b2087EmBranco = (status2087 === '' || status2087 === '-') && (os2087 === '' || os2087 === '-');
        const b2138EmBranco = (status2138 === '' || status2138 === '-') && (os2138 === '' || os2138 === '-');

        const tem2078AtivaOuRealizada = (data2078Str !== '' && data2078Str !== '-') ||
            (status2078Lower === 'encerrada' || status2078Lower === 'concluida') ||
            (status2078Lower === 'liberada' || (os2078 !== '' && os2078 !== '-'));

        let opsPendentesDestaLinha = [];

        operacoesMapeadas.forEach(op => {
            if (op.cod === '2143' && tem2078AtivaOuRealizada) return;

            if (op.cod === '2078' && b2078EmBranco && !b2079EmBranco) return;
            if (op.cod === '2079') {
                if (b2078EmBranco && b2079EmBranco) return;
                if (b2079EmBranco && !b2078EmBranco) return;
            }
            if (op.cod === '2087' && b2087EmBranco && !b2138EmBranco) return;
            if (op.cod === '2138') {
                if (b2087EmBranco && b2138EmBranco) return;
                if (b2138EmBranco && !b2087EmBranco) return;
            }

            let statusString = row[`Status da O.S. ${op.cod}`] ? row[`Status da O.S. ${op.cod}`].toString().trim() : '';
            let osString = row[`OS-${op.cod}`] ? row[`OS-${op.cod}`].toString().trim() : '';

            let dataOpRealizadaCelula = row[op.colDt];
            let dataOpRealizadaString = dataOpRealizadaCelula ? dataOpRealizadaCelula.toString().trim() : '';

            let osChave = (osString && osString !== '-') ? osString : '-';
            let estaEmBranco = (statusString === '' || statusString === '-') && (osString === '' || osString === '-');
            let statusLower = statusString.toLowerCase();
            let temDataRealizacao = (dataOpRealizadaString !== '' && dataOpRealizadaString !== '-');
            let ehEncerrada = (statusLower === 'encerrada' || statusLower === 'concluida');

            if (temDataRealizacao || ehEncerrada) {
                let dataEncerramento = null;
                let dataFormatada = '';

                if (dataOpRealizadaCelula instanceof Date) {
                    dataOpRealizadaCelula.setTime(dataOpRealizadaCelula.getTime() + dataOpRealizadaCelula.getTimezoneOffset() * 60 * 1000);
                    dataEncerramento = new Date(dataOpRealizadaCelula);
                } else if (temDataRealizacao) {
                    const partes = dataOpRealizadaString.split('-');
                    if (partes.length === 3) {
                        dataEncerramento = new Date(partes[0], partes[1] - 1, partes[2]);
                    } else {
                        const partesBarras = dataOpRealizadaString.split('/');
                        if (partesBarras.length === 3) {
                            dataEncerramento = new Date(partesBarras[2], partesBarras[1] - 1, partesBarras[0]);
                        }
                    }
                }

                let textoIdadeOperacao = `✅ Realizado`;
                if (dataEncerramento && !isNaN(dataEncerramento.getTime())) {
                    dataFormatada = `${dataEncerramento.toLocaleDateString('pt-BR')}`;
                    let dataPlantio = null;

                    if (dataPlantioRaw instanceof Date) {
                        dataPlantioRaw.setTime(dataPlantioRaw.getTime() + dataPlantioRaw.getTimezoneOffset() * 60 * 1000);
                        dataPlantio = new Date(dataPlantioRaw);
                    } else if (dataPlantioRaw) {
                        const strPlantio = dataPlantioRaw.toString().trim();
                        const partesP = strPlantio.split('-');
                        if (partesP.length === 3) {
                            dataPlantio = new Date(partesP[0], partesP[1] - 1, partesP[2]);
                        } else {
                            const partesPBarras = strPlantio.split('/');
                            if (partesPBarras.length === 3) {
                                dataPlantio = new Date(partesPBarras[2], partesPBarras[1] - 1, partesPBarras[0]);
                            }
                        }
                    }

                    if (dataPlantio && !isNaN(dataPlantio.getTime())) {
                        dataEncerramento.setHours(0, 0, 0, 0);
                        dataPlantio.setHours(0, 0, 0, 0);
                        const diffTempo = dataEncerramento - dataPlantio;
                        const diasDecorridos = Math.floor(diffTempo / (1000 * 60 * 60 * 24));
                        textoIdadeOperacao = `✅ Realizado com: <strong>${diasDecorridos >= 0 ? diasDecorridos : 0} Dias</strong> após o plantio`;
                    }
                }

                linesProcessadas.push({
                    tipo: 'realizadas',
                    fazenda: nomeFazendaTratado,
                    codPropriedade: codProp,
                    dias: diasAtual,
                    talhao: talhao,
                    area: areaFloat,
                    opCod: op.cod,
                    opDesc: op.desc,
                    numOS: osChave,
                    badge: `<span class="status-alert done" style="background-color: #2e7d32; color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 10px;">Realizada em ${dataFormatada}</span>`,
                    textoIdade: textoIdadeOperacao
                });

            } else if (statusLower === 'liberada' || (osString !== '' && osString !== '-')) {
                linesProcessadas.push({
                    tipo: 'andamento',
                    fazenda: nomeFazendaTratado,
                    codPropriedade: codProp,
                    dias: diasAtual,
                    talhao: talhao,
                    area: areaFloat,
                    opCod: op.cod,
                    opDesc: op.desc,
                    numOS: osChave,
                    badge: '<span class="status-alert progress" style="background-color: #1565c0; color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 10px;">⚙️ O.S. Liberada</span>',
                    textoIdade: `🍇 Idade Atual: <strong>${diasAtual} Dias</strong> Plantado/Colhido`
                });
            } else if (estaEmBranco) {
                opsPendentesDestaLinha.push({ cod: op.cod, desc: op.desc });
            }
        });

        if (opsPendentesDestaLinha.length > 0) {
            linesProcessadas.push({
                tipo: 'pendentes',
                fazenda: nomeFazendaTratado,
                codPropriedade: codProp,
                dias: diasAtual,
                talhao: talhao,
                area: areaFloat,
                operacoes: opsPendentesDestaLinha
            });
        }
    });

    // Agrupamento dos cartões para o Kanban
    const cartoesSemPlantioAgrupados = {};
    const cartoesPendentesAgrupados = {};
    const cartoesOutrosAgrupados = {};

    linesProcessadas.forEach(item => {
        if (item.tipo === 'sem_plantio') {
            const unixChave = `SEMPLANTIO_${item.fazenda}_${item.numOSPlantio}_${item.tipoOperacao}`;
            if (!cartoesSemPlantioAgrupados[unixChave]) {
                cartoesSemPlantioAgrupados[unixChave] = {
                    fazenda: item.fazenda,
                    codPropriedade: item.codPropriedade,
                    areaTotal: item.area,
                    talhoes: [item.talhao],
                    numOSPlantio: item.numOSPlantio,
                    tipoOperacao: item.tipoOperacao
                };
            } else {
                if (!cartoesSemPlantioAgrupados[unixChave].talhoes.includes(item.talhao)) {
                    cartoesSemPlantioAgrupados[unixChave].talhoes.push(item.talhao);
                }
                cartoesSemPlantioAgrupados[unixChave].areaTotal += item.area;
            }
        } else if (item.tipo === 'pendentes') {
            const stringOps = item.operacoes.map(o => o.cod).sort().join('-');
            const unixChave = `PENDENTE_${item.fazenda}_${item.dias}_${stringOps}`;
            if (!cartoesPendentesAgrupados[unixChave]) {
                cartoesPendentesAgrupados[unixChave] = {
                    fazenda: item.fazenda,
                    codPropriedade: item.codPropriedade,
                    dias: item.dias,
                    areaTotal: item.area,
                    talhoes: [item.talhao],
                    operacoes: item.operacoes
                };
            } else {
                if (!cartoesPendentesAgrupados[unixChave].talhoes.includes(item.talhao)) {
                    cartoesPendentesAgrupados[unixChave].talhoes.push(item.talhao);
                }
                cartoesPendentesAgrupados[unixChave].areaTotal += item.area;
            }
        } else {
            const unixChave = `${item.fazenda}_${item.dias}_${item.opCod}_${item.tipo}_${item.numOS}`;
            if (!cartoesOutrosAgrupados[unixChave]) {
                cartoesOutrosAgrupados[unixChave] = {
                    tipo: item.tipo,
                    fazenda: item.fazenda,
                    codPropriedade: item.codPropriedade,
                    dias: item.dias,
                    talhoes: [item.talhao],
                    areaTotal: item.area,
                    opCod: item.opCod,
                    opDesc: item.opDesc,
                    numOS: item.numOS,
                    badge: item.badge,
                    textoIdade: item.textoIdade
                };
            } else {
                if (!cartoesOutrosAgrupados[unixChave].talhoes.includes(item.talhao)) {
                    cartoesOutrosAgrupados[unixChave].talhoes.push(item.talhao);
                }
                cartoesOutrosAgrupados[unixChave].areaTotal += item.area;
            }
        }
    });

    let totalCardsSemPlantio = 0, totalCardsPendentes = 0, totalCardsAndamento = 0, totalCardsRealizadas = 0;

    // RENDER: Sem Plantio
    if (colSemPlantio) {
        Object.values(cartoesSemPlantioAgrupados).forEach(grupo => {
            totalCardsSemPlantio++;
            const talhoesOrdenados = grupo.talhoes.sort((a, b) => a - b).join(', ');

            let blocoOSPlantioHtml = '';
            if (grupo.numOSPlantio !== '-') {
                const sufixoTipo = grupo.tipoOperacao ? ` <span style="color: #fff;">${grupo.tipoOperacao}</span>` : '';
                blocoOSPlantioHtml = `
    <div style="margin-top: 4px;">
        <span style="background: #222; padding: 6px; border-radius: 4px; display: block; font-size: 0.7em;">
            📋 <br>
            <strong style="color: #07f743; font-weight: bold;">O.S. Plantio: ${grupo.numOSPlantio}</strong>${sufixoTipo}
        </span>
    </div>
`;
            }

            const tituloFormatado = grupo.codPropriedade ? `${grupo.codPropriedade} - ${grupo.fazenda.toUpperCase()}` : grupo.fazenda.toUpperCase();

            colSemPlantio.innerHTML += `
                <article class="card" style="border-left: 5px solid #9c27b0; margin-bottom: 12px;">
                    <h3 style="font-size: 0.8em; margin-bottom: 6px; font-weight: bold; color: #fff;">${tituloFormatado}</h3>
                    <p style="font-size: 0.7em;"><strong>Talões:</strong> ${talhoesOrdenados} | <strong>Área:</strong> ${grupo.areaTotal.toFixed(2)} há</p>
                    ${blocoOSPlantioHtml}
                    <p style="color: #777; font-size: 0.7em; margin-top: 6px;">Aguardando início do plantio.</p>
                    <div class="card-badge-container" style="margin-top: 8px;">
                    <span class="status-alert" style="background: #4a148c; color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 10px;">
                    🌱 Sem Plantio</span></div>
                </article>
            `;
        });
    }

    // RENDER: Pendentes
    if (colPendentes) {
        const listaPendentes = Object.values(cartoesPendentesAgrupados);
        listaPendentes.sort((a, b) => (parseInt(b.dias) || 0) - (parseInt(a.dias) || 0));
        listaPendentes.forEach(grupo => {
            totalCardsPendentes++;

            let listaOpsHtml = '<div style="margin-top: 4px; display: flex; flex-direction: column; gap: 3px;">';
            grupo.operacoes.forEach(o => {
                listaOpsHtml += `<span style="font-size: 0.7em; color: #fff; align-self: flex-start;">
                🛸 <strong style="color: #07f743;">${o.cod}</strong> - ${o.desc}</span>`;
            });
            listaOpsHtml += '</div>';

            const talhoesOrdenados = grupo.talhoes.sort((a, b) => a - b).join(', ');

            const tituloFormatado = grupo.codPropriedade ? `${grupo.codPropriedade} - ${grupo.fazenda.toUpperCase()}` : grupo.fazenda.toUpperCase();

            colPendentes.innerHTML += `
                <article class="card" style="border-left: 5px solid #ffc107; margin-bottom: 12px;">
                    <h3 style="font-size: 0.8em; margin-bottom: 6px; font-weight: bold; color: #fff;">${tituloFormatado}</h3>
                    <p style="font-size: 0.7em;"><strong>Talões:</strong> ${talhoesOrdenados} | <strong>Área:</strong> ${grupo.areaTotal.toFixed(2)} há</p>
                    <p style="margin-top: 6px; margin-bottom: 2px; color: #aaa; font-size: 0.7em; font-weight: bold;">Operações Pendentes:</p>
                    ${listaOpsHtml}
                    <p class="card-age" style="margin-top: 8px; font-size: 0.7em; color: #aaa;">🍇 Idade Atual: <strong>${grupo.dias} Dias</strong> Plantado/Colhido</p>
                    <div class="card-badge-container" style="margin-top: 8px;"><span class="status-alert pending" style="background-color: #e65100; color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 10px;">⏳ Planejado</span></div>
                </article>
            `;
        });
    }

    // RENDER: Outros (Andamento e Realizadas)
    const listaOutros = Object.values(cartoesOutrosAgrupados);
    listaOutros.sort((a, b) => (parseInt(b.dias) || 0) - (parseInt(a.dias) || 0));
    listaOutros.forEach(grupo => {
        const talhoesOrdenados = grupo.talhoes.sort((a, b) => a - b).join(', ');
        const corBorda = grupo.tipo === 'andamento' ? '#2196F3' : '#4CAF50';

        let blocoInfoOSHtml = '';
        if (grupo.numOS !== '-') {
            blocoInfoOSHtml = `<p style="font-size: 0.7em; color: #07f743; margin: 2px 0;"><strong>O.S.: ${grupo.numOS}</strong></p>`;
        }

        const tituloFormatado = grupo.codPropriedade ? `${grupo.codPropriedade} - ${grupo.fazenda.toUpperCase()}` : grupo.fazenda.toUpperCase();

        const cardHtml = `
            <article class="card" style="border-left: 5px solid ${corBorda}; margin-bottom: 12px;">
                <h3 style="font-size: 0.8em; margin-bottom: 6px; font-weight: bold; color: #fff;">${tituloFormatado}</h3>
                <p style="font-size: 0.7em;"><strong>Talões:</strong> ${talhoesOrdenados} | <strong>Área:</strong> ${grupo.areaTotal.toFixed(2)} há</p>
                <div style="margin-top: 6px;">
                    ${blocoInfoOSHtml}
                    <p style="font-size: 0.7em; color: #aaa; margin: 4px 0;">
                    <strong>Operação:</strong> ${grupo.opDesc} (${grupo.opCod})</p>
                </div>
                <p class="card-age" style="font-size: 0.7em; margin-top: 6px; color: #aaa;">${grupo.textoIdade}</p>
                <div class="card-badge-container" style="margin-top: 8px;">${grupo.badge}</div>
            </article>
        `;
        if (grupo.tipo === 'andamento' && colAndamento) { totalCardsAndamento++; colAndamento.innerHTML += cardHtml; }
        if (grupo.tipo === 'realizadas' && colRealizadas) { totalCardsRealizadas++; colRealizadas.innerHTML += cardHtml; }
    });

    if (totalCardsSemPlantio === 0 && colSemPlantio) colSemPlantio.innerHTML = '<p class="empty-column-msg">Nenhuma área sem plantio.</p>';
    if (totalCardsPendentes === 0 && colPendentes) colPendentes.innerHTML = '<p class="empty-column-msg">Nenhuma área pendente.</p>';
    if (totalCardsAndamento === 0 && colAndamento) colAndamento.innerHTML = '<p class="empty-column-msg">Nenhuma área em campo.</p>';
    if (totalCardsRealizadas === 0 && colRealizadas) colRealizadas.innerHTML = '<p class="empty-column-msg">Nenhuma área encerrada.</p>';

    // Atualização segura dos cabeçalhos usando os IDs reais do HTML
    const txtTituloPendentes = document.getElementById('titulo-pendentes');
    const txtTituloAndamento = document.getElementById('titulo-andamento');
    const txtTituloRealizadas = document.getElementById('titulo-realizadas');

    if (txtTituloPendentes) txtTituloPendentes.innerHTML = `⏳ Planejado (${totalCardsPendentes})`;
    if (txtTituloAndamento) txtTituloAndamento.innerHTML = `⚙️ O.S. Liberada (${totalCardsAndamento})`;
    if (txtTituloRealizadas) txtTituloRealizadas.innerHTML = `✅ Realizadas (${totalCardsRealizadas})`;
}

function processarPlanilha(arquivo) {
    const leitor = new FileReader();
    leitor.onload = function (e) {
        try {
            const dados = new Uint8Array(e.target.result);
            const workbook = XLSX.read(dados, { type: 'array', cellDates: true });
            const nomeAbaAlvo = workbook.SheetNames.find(name => name.includes("Tratos Cana Planta")) || workbook.SheetNames[0];
            const dadosJson = XLSX.utils.sheet_to_json(workbook.Sheets[nomeAbaAlvo]);
            dadosOriginaisPlanilha = dadosJson;
            gerarFiltrosLaterais(dadosJson);
            renderizarKanban(dadosJson);
            dropZone.innerHTML = `✅ Quadro atualizado: <strong>${arquivo.name}</strong>`;
        } catch (erro) {
            alert("Erro ao ler a planilha.");
        }
    };
    leitor.readAsArrayBuffer(arquivo);
}