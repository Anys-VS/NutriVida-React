import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FormularioLogin from './FormularioLogin'

describe('FormularioLogin', () => {
  // Prueba 8: renderizado condicional
  it('muestra el mensaje de error solo cuando los datos no son válidos', async () => {
    const user = userEvent.setup()
    render(<FormularioLogin onSubmit={vi.fn()} />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Correo electrónico'), 'correo-invalido')
    await user.type(screen.getByLabelText('Contraseña'), '1234')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(screen.getByRole('alert')).toHaveTextContent('correo electrónico válido')
  })

  // Prueba 10: estado y envío
  it('actualiza su estado al escribir y envía los datos cuando son válidos', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<FormularioLogin onSubmit={onSubmit} />)

    const campoCorreo = screen.getByLabelText('Correo electrónico')
    await user.type(campoCorreo, 'paciente@gmail.com')
    expect(campoCorreo).toHaveValue('paciente@gmail.com')

    await user.type(screen.getByLabelText('Contraseña'), 'abcd')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(onSubmit).toHaveBeenCalledWith({ correo: 'paciente@gmail.com', contrasena: 'abcd' })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
