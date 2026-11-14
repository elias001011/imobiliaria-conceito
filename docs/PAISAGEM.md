# Paisagem e iluminação

Revisão de 14/11/2026.

O terreno alcança 900 m em cada eixo, estendendo somente sua borda e mantendo a quantidade de vértices da malha. As coxilhas adicionais começam depois de 140 m da casa. A câmera, o platô, o jardim e o trajeto de entrada permanecem preservados.

A mata distante usa copas mais simples e instanciadas. Uma semente própria acrescenta vegetação ao fundo sem modificar a sequência aleatória do jardim. Matrizes das árvores próximas, arbustos, capins e grama foram comparadas com a versão anterior e permanecem iguais.

## Orçamento de geometria

Contagem de terreno e vegetação, somando todas as instâncias antes do descarte por visibilidade. Não inclui a casa, os móveis, passes de sombra nem mede FPS.

| Qualidade | Triângulos anteriores | Triângulos revisados | Lotes antes / depois |
| --- | ---: | ---: | ---: |
| Alta | 852.360 | 659.920 | 12 / 12 |
| Baixa | 218.280 | 217.320 | 10 / 10 |

Não há novas texturas ou luzes para completar o fundo. A geometria é criada uma vez, compartilhada entre instâncias e descartada com a cena.

## Iluminação preservada

O sol que ilumina a cena mantém os valores originais: azimute de 70°, elevação de 9° e cor linear (1, 0,63, 0,31). A luz externa varia de 6,5 a 0,42 entre dia e noite, com a cor noturna #8caeff. Ambiente, exposição e luzes interiores conservam os valores anteriores à alteração visual dos astros.

Os discos animados do sol e da lua são elementos decorativos do domo. Não movem a luz direcional, não geram uma luz adicional e não alteram o ambiente usado nos reflexos. A bruma, as nuvens e o gradiente do céu usam a direção original do sol.

Os testes verificam a invariância dessa direção durante a animação, o platô da casa, o alcance do terreno e os limites de triângulos da malha nos dois níveis de qualidade.

O disco visível do sol começa alinhado à direção original (70° / 9°) em ambos os formatos. Durante a troca de tema, desce no mesmo azimute, sem atravessar para o lado oposto. O teste verifica tanto esse alinhamento visual quanto a invariância da iluminação.
