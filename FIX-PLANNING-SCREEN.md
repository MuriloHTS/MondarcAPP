# Correções Necessárias no App.js para Planejamento

## 1. Importar a função deleteMultipleCategories do hook

No App.js, onde você desestrutura o hook useCategories, adicione `deleteMultipleCategories`:

```javascript
const {
  categories,
  setCategories,
  newCategory,
  setNewCategory,
  isLoading: categoryLoading,
  loadCategories,
  addCategory: performAddCategory,
  deleteCategory: performDeleteCategory,
  deleteMultipleCategories,  // ADICIONAR ESTA LINHA
} = useCategories(showNotification);
```

## 2. Garantir que a constante months tenha todos os 12 meses

Verifique se a constante `months` está completa com todos os 12 meses:

```javascript
const months = [
  { value: 1, name: "Janeiro" },
  { value: 2, name: "Fevereiro" },
  { value: 3, name: "Março" },
  { value: 4, name: "Abril" },
  { value: 5, name: "Maio" },
  { value: 6, name: "Junho" },
  { value: 7, name: "Julho" },
  { value: 8, name: "Agosto" },
  { value: 9, name: "Setembro" },
  { value: 10, name: "Outubro" },
  { value: 11, name: "Novembro" },
  { value: 12, name: "Dezembro" },
];
```

## 3. Corrigir a função performDeleteMultipleCategories

Procure a função `performDeleteMultipleCategories` e substitua por:

```javascript
const performDeleteMultipleCategories = async (ids, categoryName) => {
  try {
    await deleteMultipleCategories(ids, categoryName);
  } catch (error) {
    // Erro já tratado no hook
  }
};
```

## 4. Adicionar useEffect para recarregar categorias ao voltar para a tela

Adicione este useEffect após os outros useEffects:

```javascript
// Recarregar categorias quando a tela mudar para planning
useEffect(() => {
  if (currentScreen === "planning" && currentUser && dataLoaded) {
    loadCategories();
  }
}, [currentScreen, currentUser, dataLoaded]);
```

## 5. Garantir que o formulário limpe corretamente após adicionar

Na função `addCategory`, após o sucesso, certifique-se de limpar o formulário:

```javascript
// Limpar formulário
setNewCategory({
  name: "",
  type: "expense",
  budget: "",
  month: planningMode === "monthly" ? selectedMonth : "all",
});
```

## 6. Adicionar verificação antes de criar categoria anual

Na função `addCategory`, antes de chamar `performAddCategory`, adicione uma verificação:

```javascript
// Para modo anual, verificar se já existe alguma categoria com esse nome
if (planningMode === "annual") {
  const existingCategory = categories.find(
    cat => cat.name === newCategory.name && cat.type === newCategory.type
  );
  
  if (existingCategory) {
    showNotification(
      `Já existe uma categoria "${newCategory.name}" cadastrada. Para categorias anuais, use um nome único.`,
      "error"
    );
    return;
  }
}
```

## 7. Implementação Completa do Botão de Exclusão para Categorias Anuais

Na seção onde lista as categorias agrupadas (modo anual), o botão de exclusão deve ficar assim:

```javascript
<button
  onClick={() => {
    if (!isLoading.deleteCategory) {
      showConfirmDialog(
        "Confirmar Exclusão",
        `Tem certeza que deseja excluir a categoria "${group.name}" de todos os meses? Todos os lançamentos relacionados também serão removidos.`,
        () => performDeleteMultipleCategories(group.ids, group.name),
        "danger"
      );
    }
  }}
  disabled={isLoading.deleteCategory}
  className={`transition-colors ${
    isLoading.deleteCategory
      ? "opacity-50 cursor-not-allowed"
      : darkMode
      ? "text-red-400 hover:text-red-300"
      : "text-red-600 hover:text-red-800"
  }`}
>
  {isLoading.deleteCategory ? (
    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
  ) : (
    <Trash2 size={16} />
  )}
</button>
```

## Teste as Correções

Após implementar estas correções:

1. **Teste criar categoria anual**: Deve criar para todos os 12 meses
2. **Teste excluir categoria anual**: Deve remover de todos os meses e mostrar notificação
3. **Teste sair e voltar**: As categorias devem ser recarregadas automaticamente
4. **Teste criar categoria com nome duplicado**: Deve permitir se for em meses diferentes
