jest.mock('../models/Appointment', () => ({
  findById: jest.fn()
}));

jest.mock('../models/Chat', () => ({
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn()
}));

const Appointment = require('../models/Appointment');
const Chat = require('../models/Chat');
const { sendChatMessage, getChatMessages } = require('./chatController');

const createResponse = () => ({
  statusCode: 200,
  payload: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.payload = body;
    return this;
  }
});

describe('chatController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('blocks farmer from sending the first appointment message', async () => {
    const req = {
      body: {
        appointmentId: 'appointment-1',
        message: 'Hello expert'
      },
      user: {
        id: 'farmer-1',
        role: 'farmer'
      }
    };
    const res = createResponse();
    const next = jest.fn();

    Appointment.findById.mockResolvedValue({
      farmerId: 'farmer-1',
      expertId: 'expert-1'
    });
    Chat.findOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      })
    });

    await sendChatMessage(req, res, next);

    expect(Chat.create).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('Expert must send the first message for this appointment');
  });

  test('allows expert to send the first appointment message', async () => {
    const req = {
      body: {
        appointmentId: 'appointment-1',
        message: 'Hello farmer'
      },
      user: {
        id: 'expert-1',
        role: 'expert'
      }
    };
    const res = createResponse();
    const next = jest.fn();
    const createdMessage = {
      _id: 'message-1',
      appointmentId: 'appointment-1',
      senderId: 'expert-1',
      senderRole: 'expert',
      message: 'Hello farmer'
    };

    const appointment = {
      farmerId: 'farmer-1',
      expertId: 'expert-1',
      status: 'accepted',
      consultation: {},
      save: jest.fn().mockResolvedValue(true)
    };
    Appointment.findById.mockResolvedValue(appointment);
    Chat.findOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      })
    });
    Chat.create.mockResolvedValue(createdMessage);

    await sendChatMessage(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(appointment.status).toBe('active');
    expect(appointment.consultation.startTime).toBeInstanceOf(Date);
    expect(appointment.save).toHaveBeenCalled();
    expect(Chat.create).toHaveBeenCalledWith(
      expect.objectContaining({
        appointmentId: 'appointment-1',
        senderId: 'expert-1',
        senderRole: 'expert',
        message: 'Hello farmer'
      })
    );
    expect(res.statusCode).toBe(201);
    expect(res.payload.data.appointmentStatus).toBe('active');
  });

  test('allows farmer replies after expert has already sent the first message', async () => {
    const req = {
      body: {
        appointmentId: 'appointment-1',
        message: 'Thanks expert'
      },
      user: {
        id: 'farmer-1',
        role: 'farmer'
      }
    };
    const res = createResponse();
    const next = jest.fn();
    const createdMessage = {
      _id: 'message-2',
      appointmentId: 'appointment-1',
      senderId: 'farmer-1',
      senderRole: 'farmer',
      message: 'Thanks expert'
    };

    const appointment = {
      farmerId: 'farmer-1',
      expertId: 'expert-1',
      status: 'active',
      consultation: {},
      save: jest.fn()
    };
    Appointment.findById.mockResolvedValue(appointment);
    Chat.findOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'message-1',
          senderRole: 'expert',
          message: 'Hello farmer'
        })
      })
    });
    Chat.create.mockResolvedValue(createdMessage);

    await sendChatMessage(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(appointment.save).not.toHaveBeenCalled();
    expect(Chat.create).toHaveBeenCalledWith(
      expect.objectContaining({
        senderId: 'farmer-1',
        senderRole: 'farmer',
        message: 'Thanks expert'
      })
    );
    expect(res.statusCode).toBe(201);
  });

  test('blocks chat message from non-participant', async () => {
    const req = {
      body: {
        appointmentId: 'appointment-1',
        message: 'Hello expert'
      },
      user: {
        id: 'other-user',
        role: 'farmer'
      }
    };
    const res = createResponse();
    const next = jest.fn();

    Appointment.findById.mockResolvedValue({
      farmerId: 'farmer-1',
      expertId: 'expert-1'
    });
    Chat.findOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'message-1',
          senderRole: 'expert'
        })
      })
    });

    await sendChatMessage(req, res, next);

    expect(Chat.create).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('fetches appointment chat messages in ascending order', async () => {
    const req = {
      params: {
        appointmentId: 'appointment-1'
      },
      user: {
        id: 'expert-1',
        role: 'expert'
      }
    };
    const res = createResponse();
    const next = jest.fn();
    const messages = [
      { _id: 'message-1', message: 'First' },
      { _id: 'message-2', message: 'Second' }
    ];

    Appointment.findById.mockResolvedValue({
      farmerId: 'farmer-1',
      expertId: 'expert-1'
    });
    Chat.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(messages)
      })
    });

    await getChatMessages(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.payload.data).toEqual(messages);
  });
});
